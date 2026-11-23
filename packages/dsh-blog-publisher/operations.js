/**
 * The publishing operations shared by every caller.
 *
 * The model-facing tool, the sidebar panel, and the slash command all reach
 * this module, so one operation has one implementation: a fix here changes
 * every path, and no path can drift from another.
 *
 * @module @local/blog-publisher/operations
 */

import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { scrubbedParentEnv } from '@deepseek-ai/dsh-subprocess'

/** Content sections the publisher can commit, keyed by their directory name. */
export const SECTIONS = {
  post: 'posts',
  daily: 'daily',
  product: 'product',
  thinking: 'thinking',
}

/** Section choices offered to the caller. */
export const SECTION_CHOICES = Object.keys(SECTIONS)

/**
 * Build a failing outcome reported to the caller instead of a thrown error.
 * @param {string} code - Stable machine-readable failure code.
 * @param {string} message - Human-readable explanation.
 * @returns {{ code: string, message: string }} The canonical failure value.
 */
export function failure(code, message) {
  return { code, message }
}

/**
 * Run one child process in the repository.
 *
 * The child inherits the scrubbed parent environment, so variables whose names
 * contain KEY, PASSWORD, SECRET, or TOKEN never reach it; `git` and `gh`
 * authenticate from their own credential stores.
 * @param {string} command - Executable name.
 * @param {readonly string[]} args - Literal arguments.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @returns {Promise<{ exitCode: number, stdout: string, stderr: string }>} The exit code and captured streams.
 */
export function run(command, args, options) {
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
export async function runOrThrow(command, args, options) {
  const output = await run(command, args, options)
  if (output.exitCode !== 0) {
    const detail = (output.stderr || output.stdout).trim()
    throw new Error(`${command} ${args[0] ?? ''} failed with exit code ${output.exitCode}: ${detail}`)
  }
  return output.stdout
}

/**
 * Validate that a requested path is publishable content inside the repository.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @param {string} requested - Path requested by the caller, relative to the repository.
 * @param {string} section - Content section chosen by the caller.
 * @returns {string} The normalized repository-relative path.
 */
export function resolveContentPath(contentRoot, requested, section) {
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
export function buildBranchName(section, stem) {
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
export function extractPrUrl(stdout) {
  const match = /https:\/\/github\.com\/\S+\/pull\/\d+/.exec(stdout)
  return match ? match[0] : ''
}

/**
 * Extract the pull request number from its URL.
 * @param {string} url - Pull request URL.
 * @returns {number} The pull request number, or 0.
 */
export function extractPrNumber(url) {
  const match = /\/pull\/(\d+)/.exec(url)
  return match ? Number(match[1]) : 0
}

/**
 * Read the first pull request listed by `gh pr list`.
 * @param {string} stdout - Captured standard output.
 * @returns {{ url: string, number: number } | undefined} The pull request, when one exists.
 */
export function safeParsePrList(stdout) {
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
 * @returns {Promise<string[]>} One human-readable line per check.
 */
export async function listChecks(options, branch) {
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
 * List the publishable Markdown files of one repository.
 *
 * The listing walks the content root and reports each Markdown file with the
 * section it belongs to, so a caller can choose without knowing the layout.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @returns {Promise<{ path: string, section: string }[]>} The publishable files.
 */
export async function listContentFiles(options, contentRoot) {
  const output = await run('git', ['ls-files', '--', contentRoot], options)
  if (output.exitCode !== 0)
    return []
  const files = []
  for (const line of output.stdout.split('\n')) {
    const path = line.trim()
    if (!path.endsWith('.md'))
      continue
    const section = SECTION_CHOICES.find(name => path.startsWith(`${contentRoot}/${SECTIONS[name]}/`))
    if (section)
      files.push({ path, section })
  }
  return files
}

/**
 * Build the site locally and report the outcome.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @param {string} path - Repository-relative Markdown file being previewed.
 * @param {string} section - Content section the file belongs to.
 * @returns {Promise<object>} The canonical preview result.
 */
export async function previewPost(options, contentRoot, path, section) {
  try {
    const relative = resolveContentPath(contentRoot, path, section)
    const build = await run('pnpm', ['build'], options)
    if (build.exitCode !== 0) {
      const detail = (build.stderr || build.stdout).trim().slice(-4000)
      return failure('build_failed', `build failed with exit code ${build.exitCode}: ${detail}`)
    }
    return {
      ok: true,
      path: relative,
      section,
      output: build.stdout.trim().slice(-2000),
    }
  }
  catch (error) {
    return failure('preview_failed', error instanceof Error ? error.message : String(error))
  }
}

/**
 * Commit one Markdown file, push it, and open a pull request.
 *
 * The base branch is never modified and the pull request is never merged: a
 * human reviews and merges it.
 * @param {{ cwd: string, timeoutMs: number, maxOutputBytes: number, signal: AbortSignal }} options - Execution limits.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @param {string} defaultBranch - The protected base branch.
 * @param {{ path: string, section: string, message: string, branch?: string }} request - The publish request.
 * @returns {Promise<object>} The canonical publish result.
 */
export async function publishPost(options, contentRoot, defaultBranch, request) {
  try {
    const relative = resolveContentPath(contentRoot, request.path, request.section)
    const stem = relative.split('/').pop().replace(/\.md$/, '')
    const branch = request.branch?.trim() || buildBranchName(request.section, stem)

    // A dirty working tree would sweep unrelated edits into the commit.
    // Untracked files count too, except the published file itself.
    // Porcelain v1 lines are "XY <path>": two status columns, one space,
    // then the path, so the path starts at index 3.
    // A post's images live in a sibling folder named after the file, so the
    // publishable unit is the document plus everything under that folder.
    // Anything else in the tree is unrelated and would be swept in.
    const assetDirectory = relative.replace(/\.md$/, '')
    const owns = entry => entry === relative || entry === assetDirectory || entry.startsWith(`${assetDirectory}/`)

    const status = await runOrThrow('git', ['status', '--porcelain'], options)
    const unrelated = status
      .split('\n')
      .filter(line => line.length > 3)
      .map(line => line.slice(3).trim().replace(/^"(.*)"$/, '$1'))
      .filter(entry => !owns(entry))
    if (unrelated.length > 0) {
      return failure(
        'working_tree_dirty',
        `The working tree has uncommitted changes beyond ${relative} and ${assetDirectory}/: ${unrelated.join(', ')}. Commit or stash them first.`,
      )
    }

    const currentBranch = (await runOrThrow('git', ['rev-parse', '--abbrev-ref', 'HEAD'], options)).trim()
    if (currentBranch !== branch) {
      // The topic branch may not exist locally yet: create it from the
      // current commit, or switch to it when it is already here.
      const exists = await run('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], options)
      if (exists.exitCode === 0)
        await runOrThrow('git', ['checkout', branch], options)
      else
        await runOrThrow('git', ['checkout', '-b', branch], options)
    }

    // Stage the document and its asset folder together when the folder is
    // present; `git add` would fail on a path that does not exist.
    const stagedPaths = [relative]
    if (existsSync(join(options.cwd, assetDirectory)))
      stagedPaths.push(assetDirectory)
    await runOrThrow('git', ['add', '--', ...stagedPaths], options)
    const staged = await runOrThrow('git', ['diff', '--cached', '--name-only'], options)
    if (!staged.trim())
      return failure('nothing_to_commit', `The file ${relative} has no uncommitted changes.`)

    await runOrThrow('git', ['commit', '-m', request.message], options)
    const commit = (await runOrThrow('git', ['rev-parse', 'HEAD'], options)).trim()

    await runOrThrow('git', ['push', '-u', 'origin', branch], options)
    const remote = (await runOrThrow('git', ['remote', 'get-url', 'origin'], options)).trim()

    const prOutput = await run('gh', [
      'pr',
      'create',
      '--base',
      defaultBranch,
      '--head',
      branch,
      '--title',
      request.message.split('\n')[0].slice(0, 200),
      '--body',
      request.message,
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
            section: request.section,
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
      section: request.section,
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
}
