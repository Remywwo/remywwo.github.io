/**
 * Configuration for the blog publisher.
 *
 * The plugin exports no `Config` schema, so the Loader passes the row's
 * `config` block through unchanged and this module materializes it.
 *
 * @module @local/blog-publisher/config
 */

/**
 * Policy and limits for the publishing tools.
 * @typedef {object} Config
 * @property {string} [repositoryPath] Absolute path of the Git working copy to publish from. Empty means the session working directory.
 * @property {string} [defaultBranch] Branch the pull request targets.
 * @property {string} [contentRoot] Directory under the repository that holds publishable Markdown content.
 * @property {number} [timeoutMs] Deadline for one child process invocation.
 * @property {number} [maxOutputBytes] Maximum captured bytes per output stream.
 */

/** @type {Readonly<Required<Config>>} */
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
export function resolveConfig(config) {
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
