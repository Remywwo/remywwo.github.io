/**
 * The model-facing `blog_publish` and `blog_preview` tools.
 *
 * Both call the same operations the sidebar panel calls, so a fix changes
 * every path and no path can drift from another.
 *
 * @module @local/blog-publisher/tools
 */

import { defineTool } from '@deepseek-ai/dsh-tools'
import { resolveConfig } from './index.js'
import { previewPost, publishPost, SECTION_CHOICES } from './operations.js'

/** Plugin name registered with the Loader. */
export const name = 'blog-publisher-tools'

/** Host services this plugin consumes. */
export const inject = ['tools', 'systemPrompt', 'workingDirectory']

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
   *
   * The configured path wins; otherwise the Session's working directory, and
   * finally the process directory, so a call without an agent still has a
   * repository to act on.
   * @param {import('@deepseek-ai/dsh-tools').ToolRunContext} exec - Tool execution context.
   * @returns {string} The repository directory.
   */
  function repositoryFor(exec) {
    if (resolved.repositoryPath.trim())
      return resolved.repositoryPath.trim()
    const fallback = exec.agent
      ? ctx.workingDirectory.get(exec.agent.session)
      : ''
    return fallback || process.cwd()
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
    execute(args, exec) {
      return previewPost(
        optionsFor(repositoryFor(exec), exec.signal),
        resolved.contentRoot,
        args.path,
        args.section,
      )
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
        description: 'Topic branch name. Omit to generate one.',
      },
      slug: {
        type: 'string',
        description: 'English short name used in the generated branch, for example "user-research". '
          + 'Supply it when the file name has no ASCII letters, such as a Chinese title. '
          + 'A `slug:` frontmatter key in the file is used when this is omitted.',
      },
    },
    output: { schema: { oneOf: [PUBLISH_SCHEMA, FAILURE_SCHEMA] }, render: renderValue },
    execute(args, exec) {
      return publishPost(
        optionsFor(repositoryFor(exec), exec.signal),
        resolved.contentRoot,
        resolved.defaultBranch,
        {
          path: args.path,
          section: args.section,
          message: args.message,
          branch: args.branch,
          slug: args.slug,
        },
      )
    },
    presentCall: args => ({ card: 'generic', title: `Publish ${args.path}`, kind: 'other' }),
  }))
}
