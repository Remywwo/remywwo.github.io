/**
 * Browser half of @local/blog-publisher.
 *
 * It contributes one thing: the file picker that a bare `/publish` or
 * `/preview` opens. Picking a file submits the command line back to the Host,
 * which owns every publishing operation.
 *
 * Running this file only registers a factory; the factory body runs when the
 * module table materializes this id.
 */

window.__ModuleLoader__.load({
  id: '@local/blog-publisher',
  factory(require) {
    const { z } = require('zod')

    /** This implementation's identity. */
    const PUBLISHER_ID = '@local/blog-publisher'

    /** The locale namespace for the picker's copy. */
    const NS = 'blogPublisher'

    /** The Remote namespace, which is the Host service key. */
    const REMOTE_NAMESPACE = 'blogPublisher'

    /** Section directories, in menu order. */
    const SECTIONS = {
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
      return { mode: 'strict', typeSymbol, create: factory, jsonSchema }
    }

    const stringCodec = codec(`${PUBLISHER_ID}#string`, () => z.string(), { type: 'string' })

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

    const stateCodec = codec(
      `${PUBLISHER_ID}#state`,
      () => z.object({ branch: z.string(), dirty: z.array(z.string()), remote: z.string() }),
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
     * The one namespace method this client needs.
     *
     * The standard Remote allowlist does not carry a local package, so the
     * browser mounts this contribution itself.
     */
    const contribution = {
      package: PUBLISHER_ID,
      descriptors: [{
        id: `${PUBLISHER_ID}#${REMOTE_NAMESPACE}/listFiles`,
        service: REMOTE_NAMESPACE,
        namespace: REMOTE_NAMESPACE,
        method: 'listFiles',
        invocation: { kind: 'direct' },
        parameters: [{
          name: 'repositoryPath',
          wire: 'repositoryPath',
          source: 'json',
          codec: stringCodec,
          acceptsUndefined: true,
        }],
        result: listingCodec,
      }],
    }

    /** Simplified Chinese copy. */
    const zh = {
      'publish.label': '发布文章',
      'publish.description': '选择一篇文章，提交并创建 PR',
      'preview.label': '预览文章',
      'preview.description': '选择一篇文章，本地构建检查渲染',
      'picker.placeholder': '按文章名搜索',
      'picker.empty': '没有找到可发布的 Markdown 文件',
      'picker.noResults': '没有匹配的文章',
      'section.post': '文章',
      'section.daily': '碎记',
      'section.product': '作品集',
      'section.thinking': '思考',
    }

    /** English copy. */
    const en = {
      'publish.label': 'Publish a post',
      'publish.description': 'Pick a post, commit it, and open a pull request',
      'preview.label': 'Preview a post',
      'preview.description': 'Pick a post and build the site to check rendering',
      'picker.placeholder': 'Search by file name',
      'picker.empty': 'No publishable Markdown file found',
      'picker.noResults': 'No matching post',
      'section.post': 'Posts',
      'section.daily': 'Daily',
      'section.product': 'Products',
      'section.thinking': 'Thinking',
    }

    /**
     * Order the sections as the menu shows them.
     * @param {string} name - Section key.
     * @returns {number} Its order.
     */
    function sectionOrder(name) {
      const index = Object.keys(SECTIONS).indexOf(name)
      return index < 0 ? Number.MAX_SAFE_INTEGER : index
    }

    return {
      inject: ['locale', 'remote', 'remote.commands', 'commandUi'],

      async apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'blog-publisher: dictionaries')

        const disposeRemote = await ctx.remote.$mount(contribution)
        ctx.effect(() => disposeRemote, 'blog-publisher: remote namespace')

        // Cordis refuses an undeclared `ctx.remote.<ns>` read, and this
        // namespace only exists after the mount above, so the callers live in
        // a scope that declares it.
        ctx.inject([`remote.${REMOTE_NAMESPACE}`], (scoped) => {
          const api = scoped.remote[REMOTE_NAMESPACE]
          const t = scoped.locale.bind(NS)

          /**
           * Offer every publishable file, grouped by section.
           *
           * The group heading is the article type, so picking a row both
           * chooses the type and names the file.
           * @returns {Array<object>} The picker rows.
           */
          const options = async () => {
            const result = await api.listFiles('')
            if (result?.files === undefined)
              throw new Error(result?.message ?? 'could not list the content files')
            return [...result.files]
              .sort((left, right) => sectionOrder(left.section) - sectionOrder(right.section)
                || left.path.localeCompare(right.path))
              .map(file => ({
                id: file.path,
                label: file.path.split('/').pop().replace(/\.md$/, ''),
                detail: file.path,
                group: {
                  name: file.section,
                  label: t(`section.${file.section}`),
                },
              }))
          }

          const searchLabels = () => ({
            placeholder: t('picker.placeholder'),
            empty: t('picker.empty'),
            noResults: t('picker.noResults'),
          })

          /**
           * Submit the picked file as the command's argument.
           * @param {object} option - The picked row.
           * @param {object} session - The session the popup was opened for.
           * @param {string} command - Host command name.
           */
          const submit = async (option, session, command) => {
            const line = `/${command} ${option.id}`
            const result = await scoped.remote.commands.execute(session.sessionId, line, [])
            if (!result?.ok)
              throw new Error(result?.error?.message ?? `could not run ${line}`)
          }

          for (const command of ['publish', 'preview']) {
            scoped.effect(() => scoped.commandUi.decorate({
              name: command,
              available: () => true,
              ui: {
                kind: 'popupSelect',
                searchMode: 'fuzzy-label',
                searchLabels,
                options,
                onSelect: (option, session) => submit(option, session, command),
              },
            }), `blog-publisher: /${command} picker`)
          }
        })
      },
    }
  },
})
