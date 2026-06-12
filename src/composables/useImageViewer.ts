import { createGlobalState } from '@vueuse/core'

interface ImageItem {
  src: string
  alt?: string
}

export const useImageViewer = createGlobalState(() => {
  const images = ref<ImageItem[]>([])
  const currentIndex = ref(-1)
  const isOpen = computed(() => currentIndex.value >= 0)

  function open(imageList: ImageItem[], startIndex = 0) {
    images.value = imageList
    currentIndex.value = startIndex
  }

  function close() {
    currentIndex.value = -1
    images.value = []
  }

  function prev() {
    if (images.value.length === 0)
      return
    currentIndex.value = currentIndex.value > 0
      ? currentIndex.value - 1
      : images.value.length - 1
  }

  function next() {
    if (images.value.length === 0)
      return
    currentIndex.value = currentIndex.value < images.value.length - 1
      ? currentIndex.value + 1
      : 0
  }

  const currentImage = computed<ImageItem | null>(() => {
    if (currentIndex.value < 0 || currentIndex.value >= images.value.length)
      return null
    return images.value[currentIndex.value]
  })

  return {
    images,
    currentIndex,
    isOpen,
    currentImage,
    open,
    close,
    prev,
    next,
  }
})
