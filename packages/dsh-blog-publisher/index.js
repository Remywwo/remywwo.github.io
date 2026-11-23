/**
 * The Host service the browser panel calls.
 *
 * Its Remote namespace is the Cordis service key passed to `super`, not the
 * class name and not the package name: `bindTypertRemote` derives the
 * namespace from the service key unless an explicit one is given.
 *
 * The publishing operations themselves live in `./operations.js`, which the
 * model-facing tools also call, so every caller reaches one implementation.
 *
 * @module @local/blog-publisher
 */

import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  createContentFile,
  listContentFiles,
  previewPost,
  publishPost,
  readRepositoryState,
} from './operations.js'

/**
 * The prototype property the Typert protocol stores its method markers in.
 *
 * `@Remote` is a standard decorator, which plain JavaScript cannot express.
 * This is the same record the decorator writes, so the Gateway discovers these
 * methods exactly as it discovers decorated ones.
 */
const REMOTE_METHOD_DESCRIPTOR = '@deepseek-ai/dsh-typert-protocol/remote-methods'

/**
 * Mark one public instance method as a direct Remote invocation.
 * @param {object} prototype - The class prototype carrying the method.
 * @param {string} method - The method name.
 */
function markRemoteMethod(prototype, method) {
  const current = Object.getOwnPropertyDescriptor(prototype, REMOTE_METHOD_DESCRIPTOR)?.value
  const methods = current?.methods ? [...current.methods] : []
  methods.push({ method, invocation: Object.freeze({ kind: 'direct' }) })
  Object.defineProperty(prototype, REMOTE_METHOD_DESCRIPTOR, {
    value: { version: 1, methods },
    configurable: true,
    writable: true,
    enumerable: false,
  })
}

/**
 * Configuration defaults for the publishing service.
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
 * The publishing service.
 *
 * Its Cordis service key is `blogPublisher`, which is also the Remote
 * namespace the browser calls.
 */
export class BlogPublisher extends TypertRemoteService {
  /**
   * @param {import('@deepseek-ai/cordis').Context} ctx - Host context.
   * @param {Config} config - Loader-provided configuration.
   */
  constructor(ctx, config) {
    super(ctx, 'blogPublisher')
    this.resolved = resolveConfig(config)
  }

  /**
   * Resolve the repository directory for one call.
   *
   * The configured path wins; otherwise the caller's own path, and finally the
   * process directory, so a call without one still has a repository to act on.
   * @param {string | undefined} repositoryPath - Caller-supplied override.
   * @returns {string} The repository directory.
   */
  repositoryFor(repositoryPath) {
    return repositoryPath?.trim() || this.resolved.repositoryPath.trim() || process.cwd()
  }

  /**
   * Build the shared execution options for one call.
   * @param {string} cwd - Repository directory.
   * @param {AbortSignal} signal - Cancellation signal.
   */
  optionsFor(cwd, signal) {
    return {
      cwd,
      timeoutMs: this.resolved.timeoutMs,
      maxOutputBytes: this.resolved.maxOutputBytes,
      signal,
    }
  }

  /**
   * List the publishable Markdown files of the repository.
   * @param {string | undefined} repositoryPath - Repository directory override.
   * @param {AbortSignal} signal - Caller cancellation.
   * @returns The publishable files and the repository's current state.
   */
  async listFiles(repositoryPath, signal) {
    const cwd = this.repositoryFor(repositoryPath)
    const options = this.optionsFor(cwd, signal)
    const [files, state] = await Promise.all([
      listContentFiles(options, this.resolved.contentRoot),
      readRepositoryState(options),
    ])
    return { files, state }
  }

  /**
   * Build the site locally and report the outcome.
   * @param {{ path: string, section: string, repositoryPath?: string }} request - The preview request.
   * @param {AbortSignal} signal - Caller cancellation.
   * @returns The canonical preview result.
   */
  async preview(request, signal) {
    const cwd = this.repositoryFor(request.repositoryPath)
    return previewPost(this.optionsFor(cwd, signal), this.resolved.contentRoot, request.path, request.section)
  }

  /**
   * Commit one Markdown file, push it, and open a pull request.
   * @param {{ path: string, section: string, message: string, branch?: string, repositoryPath?: string }} request - The publish request.
   * @param {AbortSignal} signal - Caller cancellation.
   * @returns The canonical publish result.
   */
  async publish(request, signal) {
    const cwd = this.repositoryFor(request.repositoryPath)
    return publishPost(
      this.optionsFor(cwd, signal),
      this.resolved.contentRoot,
      this.resolved.defaultBranch,
      request,
    )
  }

  /**
   * Create one new Markdown file under a section directory.
   * @param {{ section: string, title: string, date?: string, body?: string, repositoryPath?: string }} request - The creation request.
   * @param {AbortSignal} signal - Caller cancellation.
   * @returns The canonical creation result.
   */
  async createPost(request, signal) {
    signal?.throwIfAborted()
    const cwd = this.repositoryFor(request.repositoryPath)
    return createContentFile(cwd, this.resolved.contentRoot, request)
  }
}

// Mark the public methods as Remote invocations. `@Remote` cannot be written in
// plain JavaScript, so the same prototype record is written here.
{
  const prototype = BlogPublisher.prototype
  markRemoteMethod(prototype, 'listFiles')
  markRemoteMethod(prototype, 'preview')
  markRemoteMethod(prototype, 'publish')
  markRemoteMethod(prototype, 'createPost')
}

export { resolveConfig }

export default BlogPublisher
