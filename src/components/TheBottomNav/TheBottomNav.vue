<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";

export interface TheBottomNavProps {
  currentTab: string;
  activeClientId?: string | null;
  currentTheme?: {
    accent: string;
  };
}

defineProps<TheBottomNavProps & { currentUserRole?: string }>();

defineEmits(["update:currentTab", "go-home"]);

const router = useRouter();
const route = useRoute();

// 共通のボタンクラス
const btnClass =
  "flex flex-col items-center justify-center w-14 h-full relative transition-all duration-200 active:scale-90";
const activeClass = "text-slate-800 scale-105";
const inactiveClass = "text-slate-400 hover:text-slate-600";
</script>

<template>
  <nav
    class="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-full flex items-center justify-evenly z-50 px-2"
  >
    <button
      @click.stop="
        activeClientId ? $emit('go-home') : $emit('update:currentTab', 'home');
        if (route.name === 'premium') router.push('/');
      "
      :class="[
        btnClass,
        currentTab === 'home' && route.name !== 'premium'
          ? activeClass
          : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5 transition-transform duration-200">
        {{ activeClientId ? "↩︎" : "🏠" }}
      </span>
      <span class="text-[9px] font-bold tracking-wide">
        {{ activeClientId ? "戻る" : "ホーム" }}
      </span>
      <span
        v-if="currentTab === 'home' && route.name !== 'premium'"
        class="absolute -bottom-1 w-1 h-1 bg-slate-800 rounded-full"
      ></span>
    </button>

    <button
      @click.stop="
        $emit('update:currentTab', 'calendar');
        if (route.name === 'premium') router.push('/');
      "
      :class="[
        btnClass,
        currentTab === 'calendar' ? activeClass : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5">📅</span>
      <span class="text-[9px] font-bold tracking-wide">予約</span>
      <span
        v-if="currentTab === 'calendar'"
        class="absolute -bottom-1 w-1 h-1 bg-slate-800 rounded-full"
      ></span>
    </button>

    <button
      v-if="currentUserRole === 'stylist'"
      @click.stop="
        $emit('update:currentTab', 'inventory');
        if (route.name === 'premium') router.push('/');
      "
      :class="[
        btnClass,
        currentTab === 'inventory' ? activeClass : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5">📦</span>
      <span class="text-[9px] font-bold tracking-wide">在庫</span>
      <span
        v-if="currentTab === 'inventory'"
        class="absolute -bottom-1 w-1 h-1 bg-slate-800 rounded-full"
      ></span>
    </button>

    <button
      v-if="currentUserRole === 'stylist'"
      @click.stop="$emit('update:currentTab', 'sales')"
      :class="[btnClass, currentTab === 'sales' ? activeClass : inactiveClass]"
    >
      <span class="text-xl mb-0.5">💰</span>
      <span class="text-[9px] font-bold tracking-wide">売上</span>
      <span
        v-if="currentTab === 'sales'"
        class="absolute -bottom-1 w-1 h-1 bg-slate-800 rounded-full"
      ></span>
    </button>

    <button
      @click.stop="
        $emit('update:currentTab', 'settings');
        if (route.name === 'premium') router.push('/');
      "
      :class="[
        btnClass,
        currentTab === 'settings' ? activeClass : inactiveClass,
      ]"
    >
      <span class="text-xl mb-0.5">⚙️</span>
      <span class="text-[9px] font-bold tracking-wide">設定</span>
      <span
        v-if="currentTab === 'settings'"
        class="absolute -bottom-1 w-1 h-1 bg-slate-800 rounded-full"
      ></span>
    </button>
  </nav>
</template>
