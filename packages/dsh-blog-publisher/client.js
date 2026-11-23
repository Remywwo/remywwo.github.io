/**
 * Browser half of @local/blog-publisher.
 *
 * Executing this file only registers a factory. The factory body, and every
 * side effect in it, runs when the module table materializes this id.
 *
 * The panel is a page-type tab in the right Sidebar: it recognizes no
 * resource address and is opened by kind. Its three registration steps are
 * the ones every tab type performs — the type into `ctx.sidebarRightTabs`,
 * the body into the keyed `sidebar.right.pane.tab` seat under the same id,
 * and the chip title into `sidebar.right.pane.tab.title`.
 */

window.__ModuleLoader__.load({
  id: '@local/blog-publisher',
  factory(require) {
    const React = require('react')
    const { useCallback, useEffect, useMemo, useState } = React
    const h = React.createElement
    const { z } = require('zod')

    /** This implementation's identity: the key its body and title register under. */
    const PUBLISHER_ID = '@local/blog-publisher'

    /** The tab kind. */
    const PUBLISHER_KIND = 'blogPublisher'

    /** The locale namespace. */
    const NS = 'blogPublisher'

    /** The Remote namespace, which is the Host service key. */
    const REMOTE_NAMESPACE = 'blogPublisher'

    /** The content sections a file may belong to. */
    const SECTION_LABELS = {
      post: 'posts',
      daily: 'daily',
      product: 'product',
      thinking: 'thinking',
    }

    /**
     * Build one strict codec for a JSON value.
     * @param {string} typeSymbol - Stable identity of the boundary type.
     * @param {() => object} factory - The zod schema factory.
     * @param {object} jsonSchema - The JSON Schema projection.
     * @returns {object} The codec.
     */
    function codec(typeSymbol, factory, jsonSchema) {
      return {
        mode: 'strict',
        typeSymbol,
        create: factory,
        jsonSchema,
      }
    }

    /**
     * Build the descriptor for one Remote method.
     * @param {string} method - The method name.
     * @param {Array<object>} parameters - The business parameters.
     * @param {object} result - The result codec.
     * @returns {object} The invocation descriptor.
     */
    function descriptor(method, parameters, result) {
      return {
        id: `${PUBLISHER_ID}#${REMOTE_NAMESPACE}/${method}`,
        service: REMOTE_NAMESPACE,
        namespace: REMOTE_NAMESPACE,
        method,
        invocation: { kind: 'direct' },
        parameters,
        result,
      }
    }

    /** The string codec. */
    const stringCodec = codec(
      `${PUBLISHER_ID}#string`,
      () => z.string(),
      { type: 'string' },
    )

    /** The published-file codec. */
    const fileCodec = codec(
      `${PUBLISHER_ID}#file`,
      () => z.object({ path: z.string(), section: z.string() }),
      {
        type: 'object',
        properties: { path: { type: 'string' }, section: { type: 'string' } },
        required: ['path', 'section'],
        additionalProperties: false,
      },
    )

    /** The repository-state codec. */
    const stateCodec = codec(
      `${PUBLISHER_ID}#state`,
      () => z.object({
        branch: z.string(),
        dirty: z.array(z.string()),
        remote: z.string(),
      }),
      {
        type: 'object',
        properties: {
          branch: { type: 'string' },
          dirty: { type: 'array', items: { type: 'string' } },
          remote: { type: 'string' },
        },
        required: ['branch', 'dirty', 'remote'],
        additionalProperties: false,
      },
    )

    /** The listing result codec. */
    const listingCodec = codec(
      `${PUBLISHER_ID}#listing`,
      () => z.object({ files: z.array(fileCodec.create()), state: stateCodec.create() }),
      {
        type: 'object',
        properties: { files: fileCodec.jsonSchema, state: stateCodec.jsonSchema },
        required: ['files', 'state'],
        additionalProperties: false,
      },
    )

    /**
     * The publish result codec.
     *
     * The two branches mirror what the Host actually returns: a success
     * carries `ok: true` and the pull request, and a failure carries the
     * `{ code, message }` pair the tools also report.
     */
    const resultCodec = codec(
      `${PUBLISHER_ID}#result`,
      () => z.union([
        z.object({
          ok: z.literal(true),
          path: z.string(),
          section: z.string(),
          branch: z.string(),
          commit: z.string(),
          remote: z.string(),
          pullRequestUrl: z.string(),
          pullRequestNumber: z.number(),
          checks: z.array(z.string()),
        }),
        z.object({
          code: z.string(),
          message: z.string(),
        }),
      ]),
      {
        oneOf: [
          {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              path: { type: 'string' },
              section: { type: 'string' },
              branch: { type: 'string' },
              commit: { type: 'string' },
              remote: { type: 'string' },
              pullRequestUrl: { type: 'string' },
              pullRequestNumber: { type: 'integer' },
              checks: { type: 'array', items: { type: 'string' } },
            },
            required: [
              'ok',
              'path',
              'section',
              'branch',
              'commit',
              'remote',
              'pullRequestUrl',
              'pullRequestNumber',
              'checks',
            ],
            additionalProperties: false,
          },
          {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
            required: ['code', 'message'],
            additionalProperties: false,
          },
        ],
      },
    )

    /** The contribution the browser mounts for this package's namespace. */
    const contribution = {
      package: PUBLISHER_ID,
      descriptors: [
        descriptor(
          'listFiles',
          [{
            name: 'repositoryPath',
            wire: 'repositoryPath',
            source: 'json',
            codec: stringCodec,
            acceptsUndefined: true,
          }],
          listingCodec,
        ),
        descriptor(
          'preview',
          [{
            name: 'request',
            wire: 'request',
            source: 'json',
            codec: codec(
              `${PUBLISHER_ID}#previewRequest`,
              () => z.object({ path: z.string(), section: z.string(), repositoryPath: z.string().optional() }),
              {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  section: { type: 'string' },
                  repositoryPath: { type: 'string' },
                },
                required: ['path', 'section'],
                additionalProperties: false,
              },
            ),
          }],
          resultCodec,
        ),
        descriptor(
          'publish',
          [{
            name: 'request',
            wire: 'request',
            source: 'json',
            codec: codec(
              `${PUBLISHER_ID}#publishRequest`,
              () => z.object({
                path: z.string(),
                section: z.string(),
                message: z.string(),
                branch: z.string().optional(),
                repositoryPath: z.string().optional(),
              }),
              {
                type: 'object',
                properties: {
                  path: { type: 'string' },
                  section: { type: 'string' },
                  message: { type: 'string' },
                  branch: { type: 'string' },
                  repositoryPath: { type: 'string' },
                },
                required: ['path', 'section', 'message'],
                additionalProperties: false,
              },
            ),
          }],
          resultCodec,
        ),
      ],
    }

    /**
     * The panel's stylesheet.
     *
     * The host owns the theme, so every color and metric comes from a
     * `--dsw-*` token; a renamed token degrades the look but never breaks the
     * rendering. The class names are this plugin's own.
     */
    const STYLES = `
.bp-panel {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 12px;
  box-sizing: border-box;
  font-family: var(--dsw-font-family);
  color: var(--dsw-alias-label-primary);
}

.bp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bp-heading {
  font-size: 14px;
  font-weight: 600;
}

.bp-state {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-2);
}

.bp-state-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.bp-state-label {
  flex: none;
  color: var(--dsw-alias-label-secondary);
}

.bp-state-value {
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--dsw-alias-label-primary);
}

.bp-state-warn {
  color: #d97706;
}

.bp-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bp-label {
  font-size: 12px;
  color: var(--dsw-alias-label-secondary);
}

.bp-select,
.bp-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-sm);
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 13px;
}

.bp-select:focus,
.bp-input:focus {
  outline: 1px solid var(--dsw-alias-interactive-bg-hover-accent);
  outline-offset: -1px;
}

.bp-empty {
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary);
}

.bp-actions {
  display: flex;
  gap: 8px;
}

.bp-button {
  flex: 1 1 auto;
  padding: 6px 12px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.bp-button:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.bp-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bp-button-primary {
  border-color: transparent;
  background: var(--dsw-alias-interactive-bg-hover-accent);
  color: var(--dsw-alias-label-primary);
}

.bp-outcome {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-2);
  font-size: 12px;
}

.bp-link {
  color: var(--dsw-alias-label-primary);
}

.bp-error {
  color: #d97706;
  overflow-wrap: anywhere;
}

.bp-checks {
  margin: 0;
  padding-left: 16px;
  color: var(--dsw-alias-label-secondary);
}
`

    /** Simplified Chinese dictionary. */
    const zh = { 'tab.title': '博客发布', 'heading': '博客发布', 'refresh': '刷新', 'refreshing': '刷新中…', 'loading': '读取中…', 'noFiles': '没有找到可发布的 Markdown 文件', 'selectFile': '选择文章', 'section': '分区', 'message': '提交信息', 'messagePlaceholder': 'feat: 新增文章', 'preview': '预览', 'publish': '发布', 'branch': '分支', 'branchPlaceholder': '留空则自动生成', 'currentBranch': '当前分支', 'dirtyFiles': '未提交改动', 'clean': '工作区干净', 'noRemote': '未配置远程仓库', 'publishing': '发布中…', 'previewing': '预览中…', 'published': '已创建 PR #{number}', 'failed': '失败：{message}', 'neverPublished': '尚未发布', 'summary': '{count} 个文件' }

    /** English dictionary. */
    const en = {
      'tab.title': 'Blog publisher',
      'heading': 'Blog publisher',
      'refresh': 'Refresh',
      'refreshing': 'Refreshing…',
      'loading': 'Loading…',
      'noFiles': 'No publishable Markdown file found',
      'selectFile': 'Select a file',
      'section': 'Section',
      'message': 'Commit message',
      'messagePlaceholder': 'feat: add post',
      'preview': 'Preview',
      'publish': 'Publish',
      'branch': 'Branch',
      'branchPlaceholder': 'Generated when empty',
      'currentBranch': 'Current branch',
      'dirtyFiles': 'Uncommitted changes',
      'clean': 'Working tree clean',
      'noRemote': 'No remote configured',
      'publishing': 'Publishing…',
      'previewing': 'Previewing…',
      'published': 'Created PR #{number}',
      'failed': 'Failed: {message}',
      'neverPublished': 'Not published yet',
      'summary': '{count} files',
    }

    /**
     * The panel body.
     * @param {object} props - The slot props.
     * @returns {object} The rendered element.
     */
    function BlogPublisherPanel(props) {
      const t = props.t
      const [listing, setListing] = useState(null)
      const [selected, setSelected] = useState('')
      const [message, setMessage] = useState('')
      const [branch, setBranch] = useState('')
      const [busy, setBusy] = useState('')
      const [outcome, setOutcome] = useState(null)

      const files = listing?.files ?? []

      const selectedFile = useMemo(
        () => files.find(file => file.path === selected) ?? null,
        [files, selected],
      )

      const refresh = useCallback(async () => {
        setBusy('refresh')
        try {
          const result = await props.listFiles()
          setListing(result)
          setSelected((current) => {
            if (current && result.files.some(file => file.path === current))
              return current
            return result.files[0]?.path ?? ''
          })
        }
        catch (error) {
          setOutcome({ ok: false, message: error instanceof Error ? error.message : String(error) })
        }
        finally {
          setBusy('')
        }
      }, [props])

      useEffect(() => {
        void refresh()
      }, [refresh])

      const run = useCallback(async (kind) => {
        if (!selectedFile)
          return
        setBusy(kind)
        setOutcome(null)
        try {
          const request = {
            path: selectedFile.path,
            section: selectedFile.section,
            repositoryPath: '',
          }
          const result = kind === 'preview'
            ? await props.preview(request)
            : await props.publish({ ...request, message, branch: branch || undefined })
          setOutcome(result)
          if (kind === 'publish')
            await refresh()
        }
        catch (error) {
          setOutcome({ ok: false, message: error instanceof Error ? error.message : String(error) })
        }
        finally {
          setBusy('')
        }
      }, [selectedFile, message, branch, props, refresh])

      const state = listing?.state

      return h('div', { className: 'bp-panel' }, h('div', { className: 'bp-header' }, h('span', { className: 'bp-heading' }, t('heading')), h('button', {
        type: 'button',
        className: 'bp-button bp-button-ghost',
        onClick: () => void refresh(),
        disabled: busy !== '',
      }, busy === 'refresh' ? t('refreshing') : t('refresh'))), state
        ? h('div', { className: 'bp-state' }, h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('currentBranch')), h('code', { className: 'bp-state-value' }, state.branch)), h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('dirtyFiles')), state.dirty.length
          ? h('span', { className: 'bp-state-value bp-state-warn' }, state.dirty.join(', '))
          : h('span', { className: 'bp-state-value' }, t('clean'))), state.remote
          ? null
          : h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('currentBranch')), h('span', { className: 'bp-state-value bp-state-warn' }, t('noRemote'))))
        : null, h('label', { className: 'bp-field' }, h('span', { className: 'bp-label' }, t('selectFile')), files.length
        ? h('select', {
          className: 'bp-select',
          value: selected,
          onChange: event => setSelected(event.target.value),
        }, files.map(file => h('option', {
          key: file.path,
          value: file.path,
        }, `${SECTION_LABELS[file.section] ?? file.section} — ${file.path.split('/').pop()}`)))
        : h('span', { className: 'bp-empty' }, busy === 'refresh' ? t('loading') : t('noFiles'))), h('label', { className: 'bp-field' }, h('span', { className: 'bp-label' }, t('message')), h('input', {
        type: 'text',
        className: 'bp-input',
        value: message,
        placeholder: t('messagePlaceholder'),
        onChange: event => setMessage(event.target.value),
      })), h('label', { className: 'bp-field' }, h('span', { className: 'bp-label' }, t('branch')), h('input', {
        type: 'text',
        className: 'bp-input',
        value: branch,
        placeholder: t('branchPlaceholder'),
        onChange: event => setBranch(event.target.value),
      })), h('div', { className: 'bp-actions' }, h('button', {
        type: 'button',
        className: 'bp-button',
        disabled: !selectedFile || busy !== '',
        onClick: () => void run('preview'),
      }, busy === 'preview' ? t('previewing') : t('preview')), h('button', {
        type: 'button',
        className: 'bp-button bp-button-primary',
        disabled: !selectedFile || busy !== '' || message.trim() === '',
        onClick: () => void run('publish'),
      }, busy === 'publish' ? t('publishing') : t('publish'))), outcome
        ? h('div', { className: 'bp-outcome' }, outcome.ok && outcome.pullRequestUrl
          ? h('a', {
            className: 'bp-link',
            href: outcome.pullRequestUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
          }, t('published', { number: outcome.pullRequestNumber }))
          : h('span', { className: 'bp-error' }, t('failed', { message: outcome.message ?? '' })), outcome.ok && outcome.checks?.length
          ? h('ul', { className: 'bp-checks' }, outcome.checks.map(check =>
            h('li', { key: check }, check)))
          : null)
        : null)
    }

    return {
      inject: ['slots', 'locale', 'sidebarRightTabs', 'remote'],

      async apply(ctx) {
        // The panel's stylesheet, removed when the plugin unloads.
        ctx.effect(() => {
          const tag = document.createElement('style')
          tag.dataset.plugin = PUBLISHER_ID
          tag.textContent = STYLES
          document.head.appendChild(tag)
          return () => {
            tag.remove()
          }
        }, 'blog-publisher: stylesheet')

        // Mount this package's Remote namespace: the standard allowlist does
        // not carry a local package, so the browser mounts its own.
        const disposeRemote = await ctx.remote.$mount(contribution)
        ctx.effect(() => disposeRemote, 'blog-publisher: remote namespace')

        // Stage one: the tab type.
        ctx.effect(() => ctx.sidebarRightTabs.register({
          id: PUBLISHER_ID,
          kind: PUBLISHER_KIND,
          priority: 'extension',
          title: () => ctx.locale.bind(NS)('tab.title'),
        }), 'blog-publisher: tab type')

        // The dictionaries. Chinese and English are the required baseline.
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'blog-publisher: dictionaries')

        // Stage two: the tab body, keyed by the definition's id.
        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register(
          {
            name: 'sidebar.right.pane.tab',
            key: PUBLISHER_ID,
            locale: NS,
            inject: () => ({
              listFiles: async () => {
                const result = await ctx.remote.blogPublisher.listFiles('')
                return result
              },
              preview: async request => ctx.remote.blogPublisher.preview(request),
              publish: async request => ctx.remote.blogPublisher.publish(request),
            }),
          },
          BlogPublisherPanel,
        )), 'blog-publisher: tab body')

        // The chip title.
        ctx.effect(() => ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register(
          { name: 'sidebar.right.pane.tab.title', key: PUBLISHER_ID },
          (titleProps) => {
            return h('span', null, titleProps.t('tab.title'))
          },
        )), 'blog-publisher: tab title')
      },
    }
  },
})
