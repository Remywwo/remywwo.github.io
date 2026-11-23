/**
 * Model-facing `blog_publish` and `blog_preview` tools that publish Markdown
 * content from a DeepSeek Harness session to GitHub and open a pull request
 * that triggers the repository's own deployment workflow.
 *
 * The plugin never merges and never pushes to the protected base branch: the
 * default flow commits onto a topic branch, pushes it, opens a pull request,
 * and reports the deployment checks. The human merges.
 *
 * @module @local/blog-publisher
 */

import { execFile } from 'node:child_process'
import { scrubbedParentEnv } from '@deepseek-ai/dsh-subprocess'
import { defineTool } from '@deepseek-ai/dsh-tools'

/** Plugin name registered with the Loader. */
export const name = 'blog-publisher'

/** Host services this plugin consumes. */
export const inject = ['tools', 'systemPrompt', 'workingDirectory']

/** Content sections the publisher can commit, keyed by their directory name. */
const SECTIONS = {
  post: 'posts',
  daily: 'daily',
  product: 'product',
  thinking: 'thinking',
}

/** Section choices offered to the model. */
const SECTION_CHOICES = Object.keys(SECTIONS)

/**
 * Policy and limits for the publishing tools.
 * @typedef {object} Config
 * @property {string} [repositoryPath] Absolute path of the Git working copy to publish from. Empty means the session working directory.
 * @property {string} [defaultBranch] Branch the pull request targets.
 * @property {string} [contentRoot] Directory under the repository that holds publishable Markdown content.
 * @property {number} [timeoutMs] Deadline for one child process invocation.
 * @property {number} [maxOutputBytes] Maximum captured bytes per output stream.
 */

/**
 * Configuration defaults for the publishing tools.
 *
 * The plugin exports no `Config` schema, so the Loader passes the row's
 * `config` block through unchanged and this function materializes it.
 * @type {Readonly<Required<Config>>}
 */
const CONFIG_DEFAULTS = Object.freeze({
  repositoryPath: '',
  defaultBranch: 'main',
  contentRoot: 'pages',
  timeoutMs: 120000,
  maxOutputBytes: 1024 * 1024,
})

/**
 * Materialize and validate the plugin configuration.
 * @param {Config} config - Loader-provided configuration.
 * @returns {Required<Config>} Fully materialized policy.
 */
function resolveConfig(config) {
  const resolved = {
    repositoryPath: config?.repositoryPath ?? CONFIG_DEFAULTS.repositoryPath,
    defaultBranch: config?.defaultBranch ?? CONFIG_DEFAULTS.defaultBranch,
    contentRoot: config?.contentRoot ?? CONFIG_DEFAULTS.contentRoot,
    timeoutMs: config?.timeoutMs ?? CONFIG_DEFAULTS.timeoutMs,
    maxOutputBytes: config?.maxOutputBytes ?? CONFIG_DEFAULTS.maxOutputBytes,
  }
  if (typeof resolved.repositoryPath !== 'string')
    throw new Error('blog-publisher requires repositoryPath to be a string')
  if (typeof resolved.defaultBranch !== 'string' || !resolved.defaultBranch.trim())
    throw new Error('blog-publisher requires a non-empty defaultBranch')
  if (typeof resolved.contentRoot !== 'string' || !resolved.contentRoot.trim())
    throw new Error('blog-publisher requires a non-empty contentRoot')
  if (!Number.isFinite(resolved.timeoutMs) || resolved.timeoutMs <= 0)
    throw new Error('blog-publisher requires a positive timeoutMs')
  if (!Number.isFinite(resolved.maxOutputBytes) || resolved.maxOutputBytes <= 0)
    throw new Error('blog-publisher requires a positive maxOutputBytes')
  return resolved
}

/**
 * Complete output of one child process invocation.
 * @typedef {object} CommandOutput
 * @property {number} exitCode - Process exit code.
 * @property {string} stdout - Captured standard output.
 * @property {string} stderr - Captured standard error.
 */

/**
 * Run one child process in the repository.
 *
 * The child inherits the scrubbed parent environment, so variables whose names
 * contain KEY, PASSWORD, SECRET, or TOKEN never reach it; `git` and `gh`
 * authenticate from their own credential stores.
 * @param {string} command - Executable name.
 * @param {readonly string[]} args - Literal arguments.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @returns {Promise<CommandOutput>} The exit code and captured streams.
 */
function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      command,
      [...args],
      {
        cwd: options.cwd,
        env: {
          ...scrubbedParentEnv(),
          GH_PROMPT_DISABLED: '1',
          GH_NO_UPDATE_NOTIFIER: '1',
          GH_PAGER: '',
          NO_COLOR: '1',
          CLICOLOR: '0',
          GIT_TERMINAL_PROMPT: '0',
        },
        timeout: options.timeoutMs,
        maxBuffer: options.maxOutputBytes,
        encoding: 'utf8',
        windowsHide: true,
      },
      (error, stdout, stderr) => {
        if (options.signal.aborted) {
          reject(options.signal.reason ?? new Error(`${command} was cancelled`))
          return
        }
        if (error && typeof error.code !== 'number') {
          // The process could not start or was killed by a signal.
          reject(new Error(`${command} could not run: ${error.message}`))
          return
        }
        const exitCode = typeof error?.code === 'number' ? error.code : 0
        resolve({ exitCode, stdout: stdout ?? '', stderr: stderr ?? '' })
      },
    )
    options.signal.addEventListener('abort', () => {
      child.kill('SIGTERM')
    }, { once: true })
  })
}

/**
 * Run one command and return its stdout.
 *
 * The output is returned verbatim: trimming would corrupt porcelain output,
 * whose first line starts with a status column.
 * @param {string} command - Executable name.
 * @param {readonly string[]} args - Literal arguments.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @returns {Promise<string>} Standard output.
 */
async function runOrThrow(command, args, options) {
  const output = await run(command, args, options)
  if (output.exitCode !== 0) {
    const detail = (output.stderr || output.stdout).trim()
    throw new Error(`${command} ${args[0] ?? ''} failed with exit code ${output.exitCode}: ${detail}`)
  }
  return output.stdout
}

/**
 * Build a failing outcome reported to the model instead of a thrown error.
 * @param {string} code - Stable machine-readable failure code.
 * @param {string} message - Human-readable explanation.
 * @returns {{ code: string, message: string }} The canonical failure value.
 */
function failure(code, message) {
  return { code, message }
}

/** Canonical failing output shape shared by both tools. */
const FAILURE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    code: { type: 'string', required: true },
    message: { type: 'string', required: true },
  },
}

/** Successful preview shape. */
const PREVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean', required: true },
    path: { type: 'string', required: true },
    section: { type: 'string', required: true },
    output: { type: 'string', required: true },
  },
}

/** Successful publish shape. */
const PUBLISH_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean', required: true },
    path: { type: 'string', required: true },
    section: { type: 'string', required: true },
    branch: { type: 'string', required: true },
    commit: { type: 'string', required: true },
    remote: { type: 'string', required: true },
    pullRequestUrl: { type: 'string', required: true },
    pullRequestNumber: { type: 'integer', required: true },
    checks: { type: 'array', required: true, items: { type: 'string' } },
  },
}

/**
 * Model-facing rendering of one canonical value.
 * @returns {Array<{ type: 'text', text: string }>} The rendered content blocks.
 */
function renderValue(_args, value) {
  return [{ type: 'text', text: JSON.stringify(value) }]
}

/** Model-facing guidance describing when to use each tool. */
const PUBLISH_DESCRIPTION
  = 'Commit Markdown content to a Git repository, push it to a topic branch, and open a pull request '
  + 'that triggers the repository deployment workflow. The base branch is never modified and the pull '
  + 'request is never merged; a human reviews and merges it. Use this after the content is final. '
  + 'To check rendering before publishing, use blog_preview instead.'

const PREVIEW_DESCRIPTION
  = 'Build the site locally to check that Markdown content renders correctly, without committing, '
  + 'pushing, or opening a pull request. Use this while drafting.'

/** Model-facing guidance for the publishing tools. */
const GUIDANCE
  = 'To publish blog content: write the Markdown file under the content root, run blog_preview to check '
  + 'the rendering, then run blog_publish to commit it onto a topic branch and open a pull request. '
  + 'Never push to the base branch directly and never merge the pull request yourself; the human '
  + 'reviews and merges it.'

/**
 * Resolve the repository root to publish from.
 * @param {Required<Config>} config - Resolved plugin configuration.
 * @param {string} fallback - Session working directory.
 * @returns {string} The repository directory.
 */
function resolveRepositoryPath(config, fallback) {
  return config.repositoryPath.trim() || fallback
}

/**
 * Validate that a requested path is publishable content inside the repository.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @param {string} requested - Path requested by the model, relative to the repository.
 * @param {string} section - Content section chosen by the model.
 * @returns {string} The normalized repository-relative path.
 */
function resolveContentPath(contentRoot, requested, section) {
  const trimmed = requested.trim().replace(/^\.\//, '')
  if (!trimmed)
    throw new Error('path is required')
  if (trimmed.includes('..'))
    throw new Error('path must not contain ".."')
  if (trimmed.startsWith('/'))
    throw new Error('path must be relative to the repository root')

  const sectionDir = SECTIONS[section]
  if (!sectionDir)
    throw new Error(`section must be one of ${SECTION_CHOICES.join(', ')}`)
  const expectedRoot = `${contentRoot}/${sectionDir}`
  if (!trimmed.startsWith(`${expectedRoot}/`))
    throw new Error(`path must be under ${expectedRoot}/ for section "${section}"`)
  if (!trimmed.endsWith('.md'))
    throw new Error('path must name a Markdown file ending in .md')

  return trimmed
}

/**
 * Build a topic branch name for one publish request.
 * @param {string} section - Content section.
 * @param {string} stem - File stem of the published content.
 * @returns {string} A branch name safe for Git and GitHub.
 */
function buildBranchName(section, stem) {
  const safeStem = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  const suffix = Math.random().toString(36).slice(2, 8)
  return `content/${section}-${safeStem || 'post'}-${suffix}`
}

/**
 * Extract the pull request URL from `gh pr create` output.
 * @param {string} stdout - Captured standard output.
 * @returns {string} The pull request URL, or an empty string.
 */
function extractPrUrl(stdout) {
  const match = /https:\/\/github\.com\/\S+\/pull\/\d+/.exec(stdout)
  return match ? match[0] : ''
}

/**
 * Extract the pull request number from its URL.
 * @param {string} url - Pull request URL.
 * @returns {number} The pull request number, or 0.
 */
function extractPrNumber(url) {
  const match = /\/pull\/(\d+)/.exec(url)
  return match ? Number(match[1]) : 0
}

/**
 * Read the first pull request listed by `gh pr list`.
 * @param {string} stdout - Captured standard output.
 * @returns {{ url: string, number: number } | undefined} The pull request, when one exists.
 */
function safeParsePrList(stdout) {
  try {
    const parsed = JSON.parse(stdout)
    if (!Array.isArray(parsed) || parsed.length === 0)
      return undefined
    const first = parsed[0]
    if (typeof first?.url !== 'string')
      return undefined
    return {
      url: first.url,
      number: typeof first.number === 'number' ? first.number : extractPrNumber(first.url),
    }
  }
  catch {
    return undefined
  }
}

/**
 * List the check runs attached to a branch.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @param {string} branch - Topic branch name.
 * @returns {Promise<string[]>>} One human-readable line per check.
 */
async function listChecks(options, branch) {
  const output = await run('gh', ['pr', 'checks', branch, '--json', 'name,state'], options)
  if (output.exitCode !== 0)
    return []
  try {
    const parsed = JSON.parse(output.stdout)
    if (!Array.isArray(parsed))
      return []
    return parsed.map(entry => `${entry.name ?? 'check'}: ${entry.state ?? 'unknown'}`)
  }
  catch {
    return []
  }
}

/**
 * Register the publishing tools.
 * @param {import('@deepseek-ai/cordis').Context} ctx - Plugin context.
 * @param {Config} config - Loader-provided configuration.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config)

  ctx.systemPrompt.section({
    name: 'tool:blog-publisher',
    order: ctx.systemPrompt.getSectionOrder('TOOL_WORKFLOW'),
    text: () => GUIDANCE,
  })

  /**
   * Resolve the repository root for one call.
   * @param {import('@deepseek-ai/dsh-tools').ToolRunContext} exec - Tool execution context.
   * @returns {string} The repository directory.
   */
  function repositoryFor(exec) {
    const fallback = exec.agent
      ? ctx.workingDirectory.get(exec.agent.session)
      : resolved.repositoryPath
    return resolveRepositoryPath(resolved, fallback)
  }

  /**
   * Build the shared execution options for one call.
   * @param {string} cwd - Repository directory.
   * @param {AbortSignal} signal - Cancellation signal.
   */
  function optionsFor(cwd, signal) {
    return {
      cwd,
      timeoutMs: resolved.timeoutMs,
      maxOutputBytes: resolved.maxOutputBytes,
      signal,
    }
  }

  ctx.tools.register(defineTool({
    name: 'blog_preview',
    description: PREVIEW_DESCRIPTION,
    parameters: {
      path: {
        type: 'string',
        required: true,
        description: 'Markdown file to preview, relative to the repository root, for example "pages/posts/my-post.md".',
      },
      section: {
        type: 'string',
        required: true,
        enum: SECTION_CHOICES,
        description: 'Content section the file belongs to. It must match the file directory.',
      },
    },
    output: { schema: { oneOf: [PREVIEW_SCHEMA, FAILURE_SCHEMA] }, render: renderValue },
    async execute(args, exec) {
      const repositoryPath = repositoryFor(exec)
      try {
        const relative = resolveContentPath(resolved.contentRoot, args.path, args.section)
        const build = await run('pnpm', ['build'], optionsFor(repositoryPath, exec.signal))
        if (build.exitCode !== 0) {
          const detail = (build.stderr || build.stdout).trim().slice(-4000)
          return failure('build_failed', `build failed with exit code ${build.exitCode}: ${detail}`)
        }
        return {
          ok: true,
          path: relative,
          section: args.section,
          output: build.stdout.trim().slice(-2000),
        }
      }
      catch (error) {
        return failure('preview_failed', error instanceof Error ? error.message : String(error))
      }
    },
    presentCall: args => ({ card: 'generic', title: `Preview ${args.path}`, kind: 'read' }),
  }))

  ctx.tools.register(defineTool({
    name: 'blog_publish',
    description: PUBLISH_DESCRIPTION,
    parameters: {
      path: {
        type: 'string',
        required: true,
        description: 'Markdown file to publish, relative to the repository root, for example "pages/posts/my-post.md".',
      },
      section: {
        type: 'string',
        required: true,
        enum: SECTION_CHOICES,
        description: 'Content section the file belongs to. It must match the file directory.',
      },
      message: {
        type: 'string',
        required: true,
        description: 'Commit message describing the change.',
      },
      branch: {
        type: 'string',
        description: 'Topic branch name. Omit to generate one from the file name and section.',
      },
    },
    output: { schema: { oneOf: [PUBLISH_SCHEMA, FAILURE_SCHEMA] }, render: renderValue },
    async execute(args, exec) {
      const repositoryPath = repositoryFor(exec)
      try {
        const relative = resolveContentPath(resolved.contentRoot, args.path, args.section)
        const stem = relative.split('/').pop().replace(/\.md$/, '')
        const branch = args.branch?.trim() || buildBranchName(args.section, stem)
        const options = optionsFor(repositoryPath, exec.signal)

        // A dirty working tree would sweep unrelated edits into the commit.
        // Untracked files count too, except the published file itself.
        // Porcelain v1 lines are "XY <path>": two status columns, one space,
        // then the path, so the path starts at index 3.
        const status = await runOrThrow('git', ['status', '--porcelain'], options)
        const unrelated = status
          .split('\n')
          .filter(line => line.length > 3)
          .map(line => line.slice(3).trim().replace(/^"(.*)"$/, '$1'))
          .filter(entry => entry !== relative)
        if (unrelated.length > 0) {
          return failure(
            'working_tree_dirty',
            `The working tree has uncommitted changes beyond ${relative}: ${unrelated.join(', ')}. Commit or stash them first.`,
          )
        }

        const currentBranch = (await runOrThrow('git', ['rev-parse', '--abbrev-ref', 'HEAD'], options)).trim()
        if (currentBranch === resolved.defaultBranch)
          await runOrThrow('git', ['checkout', '-b', branch], options)
        else if (currentBranch !== branch)
          await runOrThrow('git', ['checkout', branch], options)

        await runOrThrow('git', ['add', '--', relative], options)
        const staged = await runOrThrow('git', ['diff', '--cached', '--name-only'], options)
        if (!staged.trim())
          return failure('nothing_to_commit', `The file ${relative} has no uncommitted changes.`)

        await runOrThrow('git', ['commit', '-m', args.message], options)
        const commit = (await runOrThrow('git', ['rev-parse', 'HEAD'], options)).trim()

        await runOrThrow('git', ['push', '-u', 'origin', branch], options)
        const remote = (await runOrThrow('git', ['remote', 'get-url', 'origin'], options)).trim()

        const prOutput = await run('gh', [
          'pr',
          'create',
          '--base',
          resolved.defaultBranch,
          '--head',
          branch,
          '--title',
          args.message.split('\n')[0].slice(0, 200),
          '--body',
          args.message,
        ], options)
        if (prOutput.exitCode !== 0) {
          const detail = (prOutput.stderr || prOutput.stdout).trim()
          // An open pull request for this branch is not an error: report it.
          const existing = await run('gh', ['pr', 'list', '--head', branch, '--json', 'url,number'], options)
          if (existing.exitCode === 0) {
            const parsed = safeParsePrList(existing.stdout)
            if (parsed) {
              return {
                ok: true,
                path: relative,
                section: args.section,
                branch,
                commit,
                remote,
                pullRequestUrl: parsed.url,
                pullRequestNumber: parsed.number,
                checks: [],
              }
            }
          }
          return failure('pull_request_failed', `gh pr create failed: ${detail}`)
        }

        const url = extractPrUrl(prOutput.stdout)
        if (!url)
          return failure('pull_request_failed', 'gh pr create succeeded but printed no pull request URL.')
        const checks = await listChecks(options, branch)

        return {
          ok: true,
          path: relative,
          section: args.section,
          branch,
          commit,
          remote,
          pullRequestUrl: url,
          pullRequestNumber: extractPrNumber(url),
          checks,
        }
      }
      catch (error) {
        return failure('publish_failed', error instanceof Error ? error.message : String(error))
      }
    },
    presentCall: args => ({ card: 'generic', title: `Publish ${args.path}`, kind: 'other' }),
  }))
}
