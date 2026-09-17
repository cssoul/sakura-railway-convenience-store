<script setup lang="ts">
import { computed } from 'vue'
import { useSceneStore } from '../stores/scene'
import { CAMERA_VIEWS } from '../three/core/constants'

const store = useSceneStore()

const views = (Object.keys(CAMERA_VIEWS) as (keyof typeof CAMERA_VIEWS)[]).map((id) => ({
  id,
  label: CAMERA_VIEWS[id].label,
}))

const times = [
  { id: 'morning', label: '早上' },
  { id: 'day', label: '正午' },
  { id: 'night', label: '晚上' },
] as const

const weathers = [
  { id: 'spring', label: '晴天', icon: '☀️' },
  { id: 'rain', label: '下雨', icon: '🌧️' },
  { id: 'snow', label: '下雪', icon: '🌨️' },
] as const

const activeTime = computed(() => store.timeOfDay === 'sunset' ? 'day' : store.timeOfDay)
</script>

<template>
  <div class="panel">
    <div class="title">🌸 樱花铁道便利店</div>

    <section>
      <h3>视角切换</h3>
      <div class="grid">
        <button
          v-for="v in views"
          :key="v.id"
          :class="{ active: store.viewRequest.id === v.id && store.viewRequest.nonce > 0 }"
          @click="store.requestView(v.id)"
        >
          {{ v.label }}
        </button>
      </div>
    </section>

    <section>
      <h3>时间</h3>
      <div class="row">
        <button
          v-for="t in times"
          :key="t.id"
          :class="{ active: activeTime === t.id }"
          @click="store.setTimeOfDay(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </section>

    <section>
      <h3>天气</h3>
      <div class="row">
        <button
          v-for="w in weathers"
          :key="w.id"
          :class="{ active: store.weather === w.id }"
          @click="store.setWeather(w.id)"
        >
          {{ w.icon }} {{ w.label }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.panel {
  position: fixed;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 172px;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: rgba(18, 22, 30, 0.72);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  color: #f2f4f8;
  user-select: none;
}

.title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

section {
  margin-top: 12px;
}

h3 {
  margin: 0 0 7px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(242, 244, 248, 0.6);
  letter-spacing: 2px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.row {
  display: flex;
  gap: 6px;
}

button {
  flex: 1;
  padding: 6px 4px;
  border: none;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.09);
  color: #eef1f6;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  white-space: nowrap;
}

.grid button {
  flex: none;
}

button:hover {
  background: rgba(255, 255, 255, 0.18);
}

button:active {
  transform: scale(0.95);
}

button.active {
  background: linear-gradient(135deg, #f6a8c4, #e886b0);
  color: #26202a;
  font-weight: 700;
}
</style>
