<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { initThreeScene } from '../composables/useThreeScene'
import ControlPanel from './ControlPanel.vue'

const el = ref<HTMLElement | null>(null)
let dispose: (() => void) | null = null

onMounted(() => {
  if (el.value) dispose = initThreeScene(el.value)
})

onBeforeUnmount(() => {
  dispose?.()
  dispose = null
})
</script>

<template>
  <div ref="el" class="scene-root"></div>
  <ControlPanel />
</template>

<style scoped>
.scene-root {
  width: 100%;
  height: 100%;
  touch-action: none;
}
</style>
