<script setup lang="ts">
import { useHead } from '@unhead/vue'
import { useImageViewer } from '~/composables/useImageViewer'

const route = useRoute()
const viewer = useImageViewer()

const frontmatter = computed(() => (route.meta.frontmatter as Record<string, any>) || {})

const wrapperClass = computed(() => route.path === '/product' ? 'product-wrapper' : 'px-7')

useHead({
  title: () => frontmatter.value.tabTitle || frontmatter.value.title || 'Remywwo',
})

useEventListener('click', async (e) => {
  const path = Array.from(e.composedPath())
  const first = path[0]
  if (!(first instanceof HTMLElement))
    return
  if (first.tagName !== 'IMG')
    return
  if (first.classList.contains('no-preview'))
    return
  if (path.some(el => el instanceof HTMLElement && ['A', 'BUTTON'].includes(el.tagName)))
    return
  if (!path.some(el => el instanceof HTMLElement && el.classList.contains('prose')))
    return

  // Do not open image when they are moving. Mainly for mobile to avoid conflict with hovering behavior.
  const pos = first.getBoundingClientRect()
  await new Promise(resolve => setTimeout(resolve, 50))
  const newPos = first.getBoundingClientRect()
  if (pos.left !== newPos.left || pos.top !== newPos.top)
    return

  const img = first as HTMLImageElement
  const prose = img.closest('.prose')
  if (!prose)
    return

  const all = [...prose.querySelectorAll('img:not(.no-preview)')]
  viewer.open(
    all.map(el => ({ src: (el as HTMLImageElement).src, alt: (el as HTMLImageElement).alt })),
    all.indexOf(img),
  )
})

onKeyStroke('Escape', (e) => {
  if (viewer.isOpen.value) {
    viewer.close()
    e.preventDefault()
  }
})
</script>

<template>
  <NavBar />
  <main class="mt-28 mb-5 of-x-hidden" :class="wrapperClass">
    <RouterView />
    <ClientOnly>
      <ParticleNetwork v-if="route.path === '/daily'" />
    </ClientOnly>
    <Footer :key="route.path" />
  </main>
  <ImageViewer />
</template>
