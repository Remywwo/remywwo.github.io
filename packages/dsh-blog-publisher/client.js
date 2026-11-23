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

    /** The section names the panel offers, in form order. */
    const SECTION_CHOICES = ['post', 'daily', 'product', 'thinking']

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

    /**
     * The creation result codec.
     *
     * A success carries the written path; a failure carries the same
     * `{ code, message }` pair every other operation reports.
     */
    const createCodec = codec(
      `${PUBLISHER_ID}#createResult`,
      () => z.union([
        z.object({ ok: z.literal(true), path: z.string(), section: z.string() }),
        z.object({ code: z.string(), message: z.string() }),
      ]),
      {
        oneOf: [
          {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
              path: { type: 'string' },
              section: { type: 'string' },
            },
            required: ['ok', 'path', 'section'],
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
        descriptor(
          'createPost',
          [{
            name: 'request',
            wire: 'request',
            source: 'json',
            codec: codec(
              `${PUBLISHER_ID}#createRequest`,
              () => z.object({
                section: z.string(),
                title: z.string(),
                date: z.string().optional(),
                body: z.string().optional(),
                repositoryPath: z.string().optional(),
              }),
              {
                type: 'object',
                properties: {
                  section: { type: 'string' },
                  title: { type: 'string' },
                  date: { type: 'string' },
                  body: { type: 'string' },
                  repositoryPath: { type: 'string' },
                },
                required: ['section', 'title'],
                additionalProperties: false,
              },
            ),
          }],
          createCodec,
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

.bp-modes {
  display: flex;
  gap: 4px;
  padding: 3px;
  border-radius: var(--dsw-radius-md);
  background: var(--dsw-alias-bg-layer-2);
}

.bp-mode {
  flex: 1 1 auto;
  padding: 5px 10px;
  border: none;
  border-radius: var(--dsw-radius-sm);
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.bp-mode:hover {
  color: var(--dsw-alias-label-primary);
}

.bp-mode-active {
  background: var(--dsw-alias-bg-layer-3);
  color: var(--dsw-alias-label-primary);
  font-weight: 600;
}

.bp-create,
.bp-publish {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bp-ok {
  color: var(--dsw-alias-label-primary);
  overflow-wrap: anywhere;
}
`

    /** Simplified Chinese dictionary. */
    const zh = {
      'tab.title': '博客发布',
      'guide.description': '预览并发布博客文章',
      'heading': '博客发布',
      'refresh': '刷新',
      'refreshing': '刷新中…',
      'loading': '读取中…',
      'modeExisting': '已有文章',
      'modeCreate': '新建文章',
      'newTitle': '文章标题',
      'newTitlePlaceholder': '输入标题后点新建',
      'creating': '新建中…',
      'create': '新建',
      'noFiles': '没有找到可发布的 Markdown 文件，可切到「新建文章」',
      'selectFile': '选择文章',
      'section': '分区',
      'message': '提交信息',
      'messagePlaceholder': 'feat: 新增文章',
      'preview': '预览',
      'publish': '发布',
      'branch': '分支',
      'branchPlaceholder': '留空则自动生成',
      'currentBranch': '当前分支',
      'dirtyFiles': '未提交改动',
      'clean': '工作区干净',
      'remote': '远程仓库',
      'noRemote': '未配置远程仓库',
      'publishing': '发布中…',
      'previewing': '预览中…',
      'published': '已创建 PR #{number}',
      'failed': '失败：{message}',
      'done': '完成',
      'summary': '{count} 个文件',
    }

    /** English dictionary. */
    const en = {
      'tab.title': 'Blog publisher',
      'guide.description': 'Preview and publish blog posts',
      'heading': 'Blog publisher',
      'refresh': 'Refresh',
      'refreshing': 'Refreshing…',
      'loading': 'Loading…',
      'modeExisting': 'Existing post',
      'modeCreate': 'New post',
      'newTitle': 'Title',
      'newTitlePlaceholder': 'Type a title, then create',
      'creating': 'Creating…',
      'create': 'Create',
      'noFiles': 'No publishable Markdown file found. Switch to New post.',
      'selectFile': 'Select a post',
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
      'remote': 'Remote',
      'noRemote': 'No remote configured',
      'publishing': 'Publishing…',
      'previewing': 'Previewing…',
      'published': 'Created PR #{number}',
      'failed': 'Failed: {message}',
      'done': 'Done',
      'summary': '{count} files',
    }
    /**
     * One labelled field.
     * @returns {object} The rendered field.
     */
    function Field(label, control) {
      return h('label', { className: 'bp-field' }, h('span', { className: 'bp-label' }, label), control)
    }

    /**
     * The panel body.
     *
     * Two modes share one form: publishing an existing file, and creating a new
     * one. The mode only decides where `path` comes from; preview and publish
     * then run on the resulting file.
     * @param {object} props - The slot props.
     * @returns {object} The rendered element.
     */
    function BlogPublisherPanel(props) {
      const t = props.t
      const [listing, setListing] = useState(null)
      const [mode, setMode] = useState('existing')
      const [section, setSection] = useState('post')
      const [title, setTitle] = useState('')
      const [selected, setSelected] = useState('')
      const [message, setMessage] = useState('')
      const [branch, setBranch] = useState('')
      const [busy, setBusy] = useState('')
      const [outcome, setOutcome] = useState(null)

      const files = listing?.files ?? []
      const state = listing?.state

      const selectedFile = useMemo(
        () => files.find(file => file.path === selected) ?? null,
        [files, selected],
      )

      const refresh = useCallback(async () => {
        setBusy('refresh')
        try {
          const result = await props.listFiles()
          // A failed listing arrives as `{ code, message }` rather than a throw.
          if (result?.files === undefined) {
            setOutcome(result?.message ? result : null)
            setListing(null)
            return
          }
          setListing(result)
          setSelected((current) => {
            if (current && result.files.some(file => file.path === current))
              return current
            return result.files[0]?.path ?? ''
          })
          setOutcome(null)
        }
        catch (error) {
          setOutcome({ message: error instanceof Error ? error.message : String(error) })
        }
        finally {
          setBusy('')
        }
      }, [props])

      useEffect(() => {
        void refresh()
      }, [refresh])

      /** The section a form action works on. */
      const activeSection = mode === 'create' ? section : (selectedFile?.section ?? 'post')

      /** Create the draft, then switch to it so the same buttons act on it. */
      const create = useCallback(async () => {
        if (title.trim() === '')
          return
        setBusy('create')
        setOutcome(null)
        try {
          const result = await props.createPost({ section, title, repositoryPath: '' })
          if (result?.ok) {
            setTitle('')
            setMode('existing')
            setOutcome({ ok: true, message: result.path })
            await refresh()
            setSelected(result.path)
          }
          else {
            setOutcome({ message: result?.message ?? 'create failed' })
          }
        }
        catch (error) {
          setOutcome({ message: error instanceof Error ? error.message : String(error) })
        }
        finally {
          setBusy('')
        }
      }, [title, section, props, refresh])

      const run = useCallback(async (kind) => {
        if (!selectedFile || message.trim() === '')
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
          setOutcome(result?.ok === true || result?.message ? result : { message: String(result) })
          if (kind === 'publish' && result?.ok)
            await refresh()
        }
        catch (error) {
          setOutcome({ message: error instanceof Error ? error.message : String(error) })
        }
        finally {
          setBusy('')
        }
      }, [selectedFile, message, branch, props, refresh])

      /** The section picker, shared by both modes. */
      const sectionSelect = h('select', {
        className: 'bp-select',
        value: mode === 'create' ? section : activeSection,
        disabled: mode !== 'create',
        onChange: event => setSection(event.target.value),
      }, SECTION_CHOICES.map(name => h('option', { key: name, value: name }, name)))

      // ── header: heading, refresh, and the mode switch ──────────────────────
      const header = h('div', { className: 'bp-header' }, h('span', { className: 'bp-heading' }, t('heading')), h('button', {
        type: 'button',
        className: 'bp-button bp-button-ghost',
        onClick: () => void refresh(),
        disabled: busy !== '',
      }, busy === 'refresh' ? t('refreshing') : t('refresh')))

      const modeSwitch = h('div', { className: 'bp-modes' }, h('button', {
        type: 'button',
        className: `bp-mode${mode === 'existing' ? ' bp-mode-active' : ''}`,
        onClick: () => setMode('existing'),
      }, t('modeExisting')), h('button', {
        type: 'button',
        className: `bp-mode${mode === 'create' ? ' bp-mode-active' : ''}`,
        onClick: () => setMode('create'),
      }, t('modeCreate')))

      // ── repository state ──────────────────────────────────────────────────
      const stateCard = state
        ? h('div', { className: 'bp-state' }, h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('currentBranch')), h('code', { className: 'bp-state-value' }, state.branch)), h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('dirtyFiles')), state.dirty.length
          ? h('span', { className: 'bp-state-value bp-state-warn' }, state.dirty.join(', '))
          : h('span', { className: 'bp-state-value' }, t('clean'))), state.remote
          ? null
          : h('div', { className: 'bp-state-row' }, h('span', { className: 'bp-state-label' }, t('remote')), h('span', { className: 'bp-state-value bp-state-warn' }, t('noRemote'))))
        : null

      // ── the existing-file picker ──────────────────────────────────────────
      const filePicker = h('label', { className: 'bp-field' }, h('span', { className: 'bp-label' }, t('selectFile')), files.length
        ? h('select', {
          className: 'bp-select',
          value: selected,
          onChange: event => setSelected(event.target.value),
        }, files.map(file => h('option', {
          key: file.path,
          value: file.path,
        }, `${SECTION_LABELS[file.section] ?? file.section} — ${file.path.split('/').pop()}`)))
        : h('span', { className: 'bp-empty' }, busy === 'refresh' ? t('loading') : t('noFiles')))

      // ── the create form ───────────────────────────────────────────────────
      const createForm = h('div', { className: 'bp-create' }, Field(t('section'), sectionSelect), Field(t('newTitle'), h('input', {
        type: 'text',
        className: 'bp-input',
        value: title,
        placeholder: t('newTitlePlaceholder'),
        onChange: event => setTitle(event.target.value),
      })), h('button', {
        type: 'button',
        className: 'bp-button bp-button-primary',
        disabled: title.trim() === '' || busy !== '',
        onClick: () => void create(),
      }, busy === 'create' ? t('creating') : t('create')))

      // ── the publish form ──────────────────────────────────────────────────
      const publishForm = h('div', { className: 'bp-publish' }, Field(t('message'), h('input', {
        type: 'text',
        className: 'bp-input',
        value: message,
        placeholder: t('messagePlaceholder'),
        onChange: event => setMessage(event.target.value),
      })), Field(t('branch'), h('input', {
        type: 'text',
        className: 'bp-input',
        value: branch,
        placeholder: t('branchPlaceholder'),
        onChange: event => setBranch(event.target.value),
      })), h('div', { className: 'bp-actions' }, h('button', {
        type: 'button',
        className: 'bp-button',
        disabled: !selectedFile || busy !== '' || message.trim() === '',
        onClick: () => void run('preview'),
      }, busy === 'preview' ? t('previewing') : t('preview')), h('button', {
        type: 'button',
        className: 'bp-button bp-button-primary',
        disabled: !selectedFile || busy !== '' || message.trim() === '',
        onClick: () => void run('publish'),
      }, busy === 'publish' ? t('publishing') : t('publish'))))

      // ── the outcome ───────────────────────────────────────────────────────
      let outcomeBox = null
      if (outcome) {
        const succeeded = outcome.ok === true
        const line = succeeded
          ? (outcome.pullRequestUrl
              ? h('a', {
                className: 'bp-link',
                href: outcome.pullRequestUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
              }, t('published', { number: outcome.pullRequestNumber }))
              : h('span', { className: 'bp-ok' }, outcome.message ?? t('done')))
          : h('span', { className: 'bp-error' }, t('failed', { message: outcome.message ?? outcome.code ?? '' }))
        outcomeBox = h('div', { className: 'bp-outcome' }, line, succeeded && outcome.checks?.length
          ? h('ul', { className: 'bp-checks' }, outcome.checks.map(check => h('li', { key: check }, check)))
          : null)
      }

      return h('div', { className: 'bp-panel' }, header, modeSwitch, stateCard, mode === 'create' ? createForm : filePicker, publishForm, outcomeBox)
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

        // The dictionaries. Chinese and English are the required baseline.
        // Registered before anything resolves a label through this namespace.
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'blog-publisher: dictionaries')

        // Mount this package's Remote namespace: the standard allowlist does
        // not carry a local package, so the browser mounts its own.
        const disposeRemote = await ctx.remote.$mount(contribution)
        ctx.effect(() => disposeRemote, 'blog-publisher: remote namespace')

        // Every registration that calls the namespace runs inside a context
        // that declares it. Cordis refuses an undeclared `ctx.remote.<ns>`
        // property read, and this namespace only exists after the mount above,
        // so it cannot ride the static `inject` list.
        ctx.inject([`remote.${REMOTE_NAMESPACE}`], (scoped) => {
          const api = scoped.remote[REMOTE_NAMESPACE]

          // Stage one: the tab type.
          //
          // The `guide` entry is what makes the panel reachable: the right
          // Sidebar's entry page builds its capsules from
          // `definition.guide ?? []`, so a type without one registers a body
          // nothing can open.
          scoped.effect(() => scoped.sidebarRightTabs.register({
            id: PUBLISHER_ID,
            kind: PUBLISHER_KIND,
            priority: 'extension',
            title: () => scoped.locale.bind(NS)('tab.title'),
            guide: [{
              id: 'publisher',
              order: 10,
              title: () => scoped.locale.bind(NS)('tab.title'),
              description: () => scoped.locale.bind(NS)('guide.description'),
            }],
          }), 'blog-publisher: tab type')

          // Stage two: the tab body, keyed by the definition's id.
          scoped.effect(() => scoped.slots.inject('sidebar.right.pane.tab', () => scoped.slots.register(
            {
              name: 'sidebar.right.pane.tab',
              key: PUBLISHER_ID,
              locale: NS,
              inject: () => ({
                listFiles: () => api.listFiles(''),
                preview: request => api.preview(request),
                publish: request => api.publish(request),
                createPost: request => api.createPost(request),
              }),
            },
            BlogPublisherPanel,
          )), 'blog-publisher: tab body')

          // The chip title. `locale` gives this registration its own `t` seat,
          // which is what puts the label in the chip.
          scoped.effect(() => scoped.slots.inject('sidebar.right.pane.tab.title', () => scoped.slots.register(
            { name: 'sidebar.right.pane.tab.title', key: PUBLISHER_ID, locale: NS },
            (titleProps) => {
              return h('span', null, titleProps.t('tab.title'))
            },
          )), 'blog-publisher: tab title')
        })
      },
    }
  },
})
