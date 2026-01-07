<template>
  <nav
    class="fixed bottom-0 w-full bg-white border-t border-slate-100 flex justify-around items-center pb-safe pt-2"
  >
    <button
      @click="toggleTab('home')"
      class="flex flex-col items-center p-2 w-16 transition active:scale-95"
      :class="currentTab === 'home' ? 'text-blue-600' : 'text-slate-300'"
    >
      <div class="text-2xl mb-0.5">🏠</div>
      <span class="text-[9px] font-bold">ホーム</span>
    </button>

    <button
      @click="toggleTab('ranking')"
      class="flex flex-col items-center p-2 w-16 transition active:scale-95"
      :class="currentTab === 'ranking' ? 'text-blue-600' : 'text-slate-300'"
    >
      <div class="text-2xl mb-0.5">🏆</div>
      <span class="text-[9px] font-bold">順位</span>
    </button>

    <button
      @click="toggleTab('history')"
      class="flex flex-col items-center p-2 w-16 transition active:scale-95"
      :class="currentTab === 'history' ? 'text-blue-600' : 'text-slate-300'"
    >
      <div class="text-2xl mb-0.5">📋</div>
      <span class="text-[9px] font-bold">カルテ</span>
    </button>

    <button
      @click="toggleTab('settings')"
      class="flex flex-col items-center p-2 w-16 transition active:scale-95"
      :class="currentTab === 'settings' ? 'text-blue-600' : 'text-slate-300'"
    >
      <div class="text-2xl mb-0.5">⚙️</div>
      <span class="text-[9px] font-bold">設定</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
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
