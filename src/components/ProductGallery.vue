<script setup lang="ts">
import { useImageViewer } from '~/composables/useImageViewer'

const props = defineProps<{
  images: string[]
  alt?: string
}>()

const viewer = useImageViewer()

function open(index: number) {
  viewer.open(
    props.images.map(src => ({ src, alt: props.alt || '' })),
    index,
  )
}
</script>

<template>
  <div class="product-gallery">
    <div class="gallery-grid">
      <div
        v-for="(src, index) in images"
        :key="index"
        class="gallery-item"
        @click="open(index)"
      >
        <img
          :src="src"
          :alt="`${alt || '图片'} ${index + 1}`"
          loading="lazy"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-gallery {
  margin: 2rem 0;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.gallery-item {
  border-radius: 0.75rem;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid var(--c-border);
}

.gallery-item:hover {
  transform: scale(1.02);
}

.gallery-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  margin: 0;
  display: block;
}
</style>
