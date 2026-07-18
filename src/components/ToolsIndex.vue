<script setup lang="ts">
const tools = [
  {
    title: 'Markdown 文案格式化',
    description: '整理标题、列表、引用、空行和中英文混排间距。',
    path: '/tools/markdown-formatter',
    icon: 'i-ri-markdown-line',
  },
]
</script>

<template>
  <section class="tools-index">
    <div class="tools-grid">
      <RouterLink
        v-for="tool in tools"
        :key="tool.path"
        :to="tool.path"
        class="tool-card"
      >
        <div class="tool-icon">
          <div :class="tool.icon" />
        </div>
        <div>
          <h2>{{ tool.title }}</h2>
          <p>{{ tool.description }}</p>
        </div>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.tools-index {
  /* width: min(960px, calc(100vw - 3rem)); */
  width: 100%;
  margin: 0 auto 4rem;
}

.tools-header {
  margin-bottom: 1.5rem;
}

.tools-header h1 {
  margin: 0;
  color: var(--fg-deeper);
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.1;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.tool-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: var(--c-bg-soft);
  color: inherit;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
  /* border-color: var(--fg-light); */
  /* box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); */
  border-color: var(--c-border);
  background: var(--c-bg-soft);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.dark .tool-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
}

.tool-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background: var(--c-bg);
  color: var(--fg-deeper);
  font-size: 1.3rem;
}

.tool-card h2 {
  margin: 0 0 0.45rem;
  color: var(--fg-deeper);
  font-size: 1.05rem;
}

.tool-card p {
  margin: 0;
  color: var(--fg);
  font-size: 0.9rem;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .tools-index {
    width: min(100%, calc(100vw - 1.5rem));
  }
}
</style>
