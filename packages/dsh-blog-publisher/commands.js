/**
 * The human-facing `/publish` and `/preview` slash commands.
 *
 * A bare invocation opens a picker on the client, which submits the chosen
 * file back as an argument. Typing the argument directly works too, so the
 * commands stay usable without the picker.
 *
 * @module @local/blog-publisher/commands
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveConfig } from './index.js'
import { previewPost, publishPost, SECTIONS } from './operations.js'

/** Plugin name registered with the Loader. */
export const name = 'blog-publisher-commands'

/** Host services this plugin consumes. */
export const inject = ['commands', 'workingDirectory']

/**
 * Split one command line into a path and an optional commit message.
 *
 * The message follows a `|` separator, so a path never has to be quoted.
 * @param {string} rawInput - Everything after the command name.
 * @returns {{ path: string, message: string }} The parsed arguments.
 */
function parseArguments(rawInput) {
  const text = rawInput.trim()
  const separator = text.indexOf('|')
  if (separator < 0)
    return { path: text, message: '' }
  return {
    path: text.slice(0, separator).trim(),
    message: text.slice(separator + 1).trim(),
  }
}

/**
 * Resolve the content section a repository-relative path belongs to.
 * @param {string} contentRoot - Directory under the repository holding content.
 * @param {string} path - Repository-relative Markdown path.
 * @returns {string | undefined} The section name, or undefined when outside it.
 */
function sectionOfPath(contentRoot, path) {
  for (const [section, directory] of Object.entries(SECTIONS)) {
    if (path.startsWith(`${contentRoot}/${directory}/`))
      return section
  }
  return undefined
}

/**
 * Read a draft's frontmatter title, for a commit message the human recognizes.
 * @param {string} repositoryPath - Absolute repository directory.
 * @param {string} path - Repository-relative Markdown path.
 * @returns {Promise<string>} The title, or an empty string.
 */
async function titleOf(repositoryPath, path) {
  try {
    const source = await readFile(join(repositoryPath, path), 'utf8')
    const line = source.split('\n').find(candidate => candidate.startsWith('title:'))
    return line ? line.slice('title:'.length).trim().replace(/^["']|["']$/g, '') : ''
  }
  catch {
    return ''
  }
}

/**
 * Register the two slash commands.
 * @param {import('@deepseek-ai/cordis').Context} ctx - Plugin context.
 * @param {Config} config - Loader-provided configuration.
 */
export function apply(ctx, config) {
  const resolved = resolveConfig(config)

  /**
   * Resolve the repository directory for one invocation.
   * @param {import('@deepseek-ai/dsh-commands').CommandInvocation} invocation - The invocation.
   * @returns {string} The repository directory.
   */
  function repositoryFor(invocation) {
    if (resolved.repositoryPath.trim())
      return resolved.repositoryPath.trim()
    return invocation.agent
      ? ctx.workingDirectory.get(invocation.agent.session)
      : process.cwd()
  }

  /**
   * Build the shared execution options for one invocation.
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

  const MISSING_PATH
    = 'Give a Markdown file, for example `/publish pages/posts/my-post.md`. '
    + 'Run the bare command to pick one from a list.'

  ctx.commands.register({
    name: 'preview',
    description: 'Build the site to check one Markdown file, without committing',
    input: { hint: '<path>' },
    handler: async (invocation) => {
      const { path } = parseArguments(invocation.rawInput)
      if (!path)
        return { kind: 'error', text: MISSING_PATH }

      const section = sectionOfPath(resolved.contentRoot, path)
      if (section === undefined) {
        const roots = Object.entries(SECTIONS).map(([name, dir]) => `${name}=${resolved.contentRoot}/${dir}/`)
        return { kind: 'error', text: `The path must live under one of: ${roots.join(', ')}` }
      }

      const cwd = repositoryFor(invocation)
      const result = await previewPost(
        optionsFor(cwd, invocation.signal),
        resolved.contentRoot,
        path,
        section,
      )
      if (result.ok !== true)
        return { kind: 'error', text: result.message ?? 'preview failed' }
      return { kind: 'success', text: `Preview built for ${result.path}` }
    },
  })

  ctx.commands.register({
    name: 'publish',
    description: 'Commit one Markdown file, push a topic branch, and open a pull request',
    input: { hint: '<path> [| <commit message>]' },
    handler: async (invocation) => {
      const { path, message } = parseArguments(invocation.rawInput)
      if (!path)
        return { kind: 'error', text: MISSING_PATH }

      const section = sectionOfPath(resolved.contentRoot, path)
      if (section === undefined) {
        const roots = Object.entries(SECTIONS).map(([name, dir]) => `${name}=${resolved.contentRoot}/${dir}/`)
        return { kind: 'error', text: `The path must live under one of: ${roots.join(', ')}` }
      }

      const cwd = repositoryFor(invocation)
      const title = await titleOf(cwd, path)
      // The commit message doubles as the pull request title and body, so a
      // readable default beats requiring one on every publish.
      const commitMessage = message || `docs: 发布《${title || path.split('/').pop().replace(/\.md$/, '')}》`

      const result = await publishPost(
        optionsFor(cwd, invocation.signal),
        resolved.contentRoot,
        resolved.defaultBranch,
        { path, section, message: commitMessage },
      )
      if (result.ok !== true)
        return { kind: 'error', text: result.message ?? 'publish failed' }

      const checks = result.checks?.length ? ` Checks: ${result.checks.join('; ')}` : ''
      return {
        kind: 'success',
        text: `Opened ${result.pullRequestUrl} from ${result.branch}.${checks}`,
      }
    },
  })
}
