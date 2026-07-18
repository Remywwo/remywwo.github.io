<script setup lang="ts">
import dayjs from 'dayjs'
import { useRouter } from 'vue-router/auto'

const router = useRouter()

interface ProductCard {
  path: string
  title: string
  description: string
  cover: string
  date: string
  category: string
}

const products = computed<ProductCard[]>(() => {
  return router.getRoutes()
    .filter(i => i.path.startsWith('/product/') && i.meta.frontmatter.date && !i.meta.frontmatter.draft)
    .filter(i => !i.path.endsWith('.html'))
    .sort((a, b) => +new Date(b.meta.frontmatter.date) - +new Date(a.meta.frontmatter.date))
    .map(i => ({
      path: i.meta.frontmatter.redirect || i.path,
      title: i.meta.frontmatter.title || '',
      description: i.meta.frontmatter.description || '',
      cover: i.meta.frontmatter.image || '',
      date: dayjs(i.meta.frontmatter.date as string).format('YYYY-MM-DD'),
      category: i.meta.frontmatter.category || '',
    }))
})

function goToDetail(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="waterfall-container">
    <div class="waterfall-grid">
      <article
        v-for="product in products"
        :key="product.path"
        class="design-card"
        @click="goToDetail(product.path)"
      >
        <div class="card-cover">
          <img
            :src="product.cover"
            :alt="product.title"
            loading="lazy"
            class="no-preview"
          >
          <div class="cover-overlay">
            <span class="category-tag">{{ product.category }}</span>
          </div>
        </div>
        <div class="card-body">
          <h2 class="card-title">
            {{ product.title }}
          </h2>
          <p class="card-desc">
            {{ product.description }}
          </p>
          <div class="card-meta">
            <time>{{ product.date }}</time>
          </div>
        </div>
      </article>
    </div>

    <div v-if="products.length === 0" class="empty-state">
      <p>暂无产品作品</p>
    </div>
  </div>
</template>

<style scoped>
.waterfall-container {
  max-width: 100%;
  margin: 0 auto;
}

.waterfall-grid {
  column-count: 2;
  column-gap: 1.25rem;
}

.design-card {
  break-inside: avoid;
  margin-bottom: 1.25rem;
  border-radius: 1rem;
  overflow: hidden;
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  cursor: pointer;
  transition:
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.design-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
}

.dark .design-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.card-cover {
  position: relative;
  overflow: hidden;
}

.card-cover img {
  width: 100%;
  height: auto;
  display: block;
  margin: 0;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.design-card:hover .card-cover img {
  transform: scale(1.03);
}

.cover-overlay {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
}

.category-tag {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 0.75rem;
  border-radius: 2rem;
  font-weight: 500;
}

.card-body {
  padding: 1.25rem;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--fg-deeper);
  line-height: 1.4;
}

.card-desc {
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--fg);
  margin: 0 0 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  font-size: 0.8125rem;
  color: var(--fg-light);
  opacity: 0.7;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--fg-light);
  opacity: 0.6;
}

@media (max-width: 1100px) {
  .waterfall-grid {
    column-count: 3;
  }
}

@media (max-width: 767px) {
  .waterfall-grid {
    column-count: 2;
  }
}

@media (max-width: 480px) {
  .waterfall-grid {
    column-count: 1;
  }
}
</style>
