<script setup lang="ts">
import { useImageViewer } from '~/composables/useImageViewer'

const { isOpen, currentIndex, currentImage, images, close, prev, next } = useImageViewer()

onKeyStroke('Escape', (e) => {
  if (isOpen.value) {
    close()
    e.preventDefault()
  }
})

onKeyStroke('ArrowLeft', () => {
  if (isOpen.value)
    prev()
})

onKeyStroke('ArrowRight', () => {
  if (isOpen.value)
    next()
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isOpen"
      fixed top-0 left-0 z-9999 w-screen h-screen
      flex items-center justify-center
      backdrop-blur-7 bg-black:75
      @click.self="close"
    >
      <!-- Close -->
      <button
        absolute top-8 right-8 z-2
        w-10 h-10 rounded-full
        border="1 solid white/30"
        bg="white/10"
        text-white text-xl
        flex items-center justify-center
        cursor-pointer
        transition="background 0.2s"
        hover:bg="white/20"
        @click="close"
      >
        ✕
      </button>

      <!-- Prev -->
      <button
        v-if="images.length > 1"
        absolute left-8 top="50%" z-2
        w-12 h-12 rounded-full
        border="1 solid white/30"
        bg="white/10"
        text="white 2xl"
        flex items-center justify-center
        cursor-pointer select-none
        transition="background 0.2s"
        hover:bg="white/20"
        style="transform: translateY(-50%)"
        @click.stop="prev"
      >
        ‹
      </button>

      <!-- Image -->
      <div v-if="currentImage" flex flex-col items-center>
        <img
          :src="currentImage.src"
          :alt="currentImage.alt"
          class="preview-image"
          rounded-lg object-contain
        >
        <div
          v-if="images.length > 1"
          mt-3 px-3 py-1
          rounded-full
          bg="white/10"
          text="white/70 xs"
        >
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>
      </div>

      <!-- Next -->
      <button
        v-if="images.length > 1"
        absolute right-8 top="50%" z-2
        w-12 h-12 rounded-full
        border="1 solid white/30"
        bg="white/10"
        text="white 2xl"
        flex items-center justify-center
        cursor-pointer select-none
        transition="background 0.2s"
        hover:bg="white/20"
        style="transform: translateY(-50%)"
        @click.stop="next"
      >
        ›
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.preview-image {
  max-width: calc(100vw - 16rem);
  max-height: calc(100vh - 8rem);
}
</style>
