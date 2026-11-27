import dayjs from 'dayjs'

export const isDark = useDark()
export const englishOnly = useStorage('antfu-english-only', false)

/**
 * Credit to [@hooray](https://github.com/hooray)
 * @see https://github.com/vuejs/vitepress/pull/2347
 */
export function toggleDark(event: MouseEvent) {
  // @ts-expect-error experimental API
  const isAppearanceTransition = document.startViewTransition
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isAppearanceTransition) {
    isDark.value = !isDark.value
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, innerWidth - x),
    Math.max(y, innerHeight - y),
  )
  // @ts-expect-error: Transition API
  const transition = document.startViewTransition(async () => {
    isDark.value = !isDark.value
    await nextTick()
  })
  transition.ready
    .then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ]
      document.documentElement.animate(
        {
          clipPath: isDark.value
            ? [...clipPath].reverse()
            : clipPath,
        },
        {
          duration: 400,
          easing: 'ease-out',
          pseudoElement: isDark.value
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        },
      )
    })
}

export function formatDate(d: string | Date, onlyDate = true) {
  const date = dayjs(d)
  if (onlyDate || date.year() === dayjs().year())
    return date.format('MMM D')
  return date.format('MMM D, YYYY')
}

/**
 * Which content section one page belongs to.
 *
 * A declared `type` wins, so a page can be filed somewhere other than its
 * directory; `type: blog+thinking` belongs to both. Without a declaration the
 * directory decides, which keeps every page that never declares one working.
 * `posts` and `product` map to the names pages actually declare, so their
 * directory-derived section matches the same target as a declared one.
 * @param path - The route path, for example `/posts/koa`.
 * @param frontmatter - That route's parsed frontmatter.
 * @returns The section name, possibly `+`-joined.
 */
export function sectionOf(path: string, frontmatter: Record<string, any> | undefined): string {
  const declared = frontmatter?.type
  if (typeof declared === 'string' && declared.trim())
    return declared.trim()

  const directory = path.split('/')[1] || ''
  if (directory === 'posts')
    return 'blog'
  if (directory === 'product')
    return 'design'
  return directory
}

/**
 * Whether one page belongs to a section.
 * @param path - The route path.
 * @param frontmatter - That route's parsed frontmatter.
 * @param section - The section to test, for example `blog` or `design`.
 * @returns True when the page's section list contains the requested section.
 */
export function inSection(path: string, frontmatter: Record<string, any> | undefined, section: string): boolean {
  return sectionOf(path, frontmatter)
    .split('+')
    .map(name => name.trim())
    .includes(section)
}
