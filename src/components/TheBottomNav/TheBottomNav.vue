<template>
  <nav
    class="fixed bottom-0 w-full bg-white border-t border-slate-100 flex items-center justify-between px-2 pb-safe pt-2 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]"
  >
    <button
      @click="toggleTab('home')"
      class="flex-1 flex flex-col items-center justify-center py-2 transition active:scale-95 rounded-xl group hover:bg-slate-50"
      :class="currentTab === 'home' ? 'text-blue-600' : 'text-slate-400'"
    >
      <div
        class="text-2xl mb-0.5 transform transition-transform group-hover:-translate-y-0.5"
        :class="currentTab === 'home' ? 'scale-110' : 'scale-100'"
      >
        🏠
      </div>
      <span class="text-[10px] font-bold tracking-wide">ホーム</span>
    </button>

    <button
      @click="toggleTab('ranking')"
      class="flex-1 flex flex-col items-center justify-center py-2 transition active:scale-95 rounded-xl group hover:bg-slate-50"
      :class="currentTab === 'ranking' ? 'text-blue-600' : 'text-slate-400'"
    >
      <div
        class="text-2xl mb-0.5 transform transition-transform group-hover:-translate-y-0.5"
        :class="currentTab === 'ranking' ? 'scale-110' : 'scale-100'"
      >
        🏆
      </div>
      <span class="text-[10px] font-bold tracking-wide">順位</span>
    </button>

    <button
      @click="toggleTab('history')"
      class="flex-1 flex flex-col items-center justify-center py-2 transition active:scale-95 rounded-xl group hover:bg-slate-50"
      :class="currentTab === 'history' ? 'text-blue-600' : 'text-slate-400'"
    >
      <div
        class="text-2xl mb-0.5 transform transition-transform group-hover:-translate-y-0.5"
        :class="currentTab === 'history' ? 'scale-110' : 'scale-100'"
      >
        📋
      </div>
      <span class="text-[10px] font-bold tracking-wide">カルテ</span>
    </button>

    <button
      @click="toggleTab('settings')"
      class="flex-1 flex flex-col items-center justify-center py-2 transition active:scale-95 rounded-xl group hover:bg-slate-50"
      :class="currentTab === 'settings' ? 'text-blue-600' : 'text-slate-400'"
    >
      <div
        class="text-2xl mb-0.5 transform transition-transform group-hover:-translate-y-0.5"
        :class="currentTab === 'settings' ? 'scale-110' : 'scale-100'"
      >
        ⚙️
      </div>
      <span class="text-[10px] font-bold tracking-wide">設定</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

defineProps<{
  currentTab?: string;
}>();

const emit = defineEmits(["update:currentTab"]);
const route = useRoute();
const router = useRouter();

const toggleTab = (tab: string) => {
  if (route.name !== "home") {
    router.push("/");
  }
  emit("update:currentTab", tab);
};
</script>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
</style>
