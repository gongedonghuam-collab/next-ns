<script setup lang="ts">
import { useRouter } from "vue-router";

defineProps<{
  currentTab: string;
}>();

defineEmits(["update:currentTab"]);
const router = useRouter();

const btnClass =
  "flex flex-col items-center justify-center w-14 h-full relative transition-all duration-200 active:scale-90";
const activeClass = "text-blue-600 scale-105";
const inactiveClass = "text-slate-400 hover:text-slate-600";
</script>

<template>
  <nav
    class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-full flex items-center justify-evenly z-50 px-2"
  >
    <button
      @click="$emit('update:currentTab', 'home')"
      :class="[btnClass, currentTab === 'home' ? activeClass : inactiveClass]"
    >
      <span class="text-xl mb-0.5">🏠</span>
      <span class="text-[9px] font-bold tracking-wide">ホーム</span>
      <span
        v-if="currentTab === 'home'"
        class="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
      ></span>
    </button>

    <button
      @click="$emit('update:currentTab', 'history')"
      :class="[
        btnClass,
        currentTab === 'history' ? activeClass : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5">📖</span>
      <span class="text-[9px] font-bold tracking-wide">履歴</span>
      <span
        v-if="currentTab === 'history'"
        class="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
      ></span>
    </button>

    <button
      @click="$emit('update:currentTab', 'settings')"
      :class="[
        btnClass,
        currentTab === 'settings' ? activeClass : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5">⚙️</span>
      <span class="text-[9px] font-bold tracking-wide">設定</span>
      <span
        v-if="currentTab === 'settings'"
        class="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full"
      ></span>
    </button>
  </nav>
</template>
