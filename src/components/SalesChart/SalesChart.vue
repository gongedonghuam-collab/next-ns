<script setup lang="ts">
import { computed } from "vue";

// 型定義
export interface SalesData {
  label: string;
  amount: number;
}

// Props定義
const props = defineProps<{
  data: SalesData[];
  period: string; // "1m", "3m", "6m", "1y" etc.
  color: string; // HEX code (例: "#0d9488")
}>();

// Emits定義
const emit = defineEmits(["update:period"]);

// 期間ラベル
const periods = [
  { label: "1ヶ月", value: "1m" },
  { label: "3ヶ月", value: "3m" },
  { label: "半年", value: "6m" },
  { label: "1年", value: "1y" },
  { label: "3年", value: "3y" },
  { label: "全期間", value: "all" },
];

// --- ロジック部分 ---

// データの最大値を計算（グラフの高さ計算用）
const maxAmount = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0)
    return 10000;
  const amounts = props.data.map((d) => Number(d.amount) || 0);
  const max = Math.max(...amounts);
  return max > 0 ? max : 10000;
});

// バーの高さを計算 (パーセント)
const barHeight = (amount: number) => {
  const val = Number(amount) || 0;
  const percentage = (val / maxAmount.value) * 100;
  return Math.max(0, Math.min(percentage, 100));
};
</script>

<template>
  <div
    class="w-full h-full flex flex-col bg-white p-4 rounded-3xl border border-stone-100 shadow-sm font-sans"
  >
    <!-- ヘッダーエリア -->
    <div class="flex justify-between items-center mb-6 flex-wrap gap-2">
      <!-- 期間切り替えタブ -->
      <div
        class="flex bg-stone-100 rounded-lg p-1 overflow-x-auto max-w-full custom-scrollbar"
      >
        <button
          v-for="p in periods"
          :key="p.value"
          @click="emit('update:period', p.value)"
          class="text-[10px] font-bold px-3 py-1.5 rounded-md transition whitespace-nowrap"
          :style="{
            backgroundColor: period === p.value ? '#ffffff' : 'transparent',
            color: period === p.value ? color : '#a8a29e',
            boxShadow:
              period === p.value ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
          }"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- グラフコンテナ -->
    <div class="relative flex-1 min-h-[200px]">
      <!-- 背景の目盛り線 -->
      <div
        class="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-20 z-0"
      >
        <div class="border-t border-stone-300 border-dashed w-full h-0"></div>
        <div class="border-t border-stone-300 border-dashed w-full h-0"></div>
        <div class="border-t border-stone-300 border-dashed w-full h-0"></div>
        <div class="border-t border-stone-300 border-dashed w-full h-0"></div>
        <div class="border-b border-stone-300 border-dashed w-full h-0"></div>
      </div>

      <!-- グラフエリア (スクロール対応) -->
      <!-- pt-10を追加して上部の金額表示スペースを確保 -->
      <div
        class="absolute inset-0 overflow-x-auto pb-2 pt-10 custom-scrollbar z-10"
      >
        <div
          class="h-full flex items-end gap-2 px-2 pb-6"
          :style="{ minWidth: `${Math.max((data || []).length * 50, 100)}%` }"
        >
          <div
            v-for="(item, index) in data"
            :key="index"
            class="h-full flex-1 flex flex-col justify-end items-center group cursor-pointer relative min-w-[30px]"
          >
            <!-- バー -->
            <div
              class="w-full flex-1 flex items-end justify-center relative mb-1"
            >
              <!-- 金額を常にフル桁で表示 -->
              <div
                v-if="item.amount > 0"
                class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[10px] font-bold whitespace-nowrap transition-all"
                :style="{ color: color }"
              >
                ¥{{ item.amount.toLocaleString() }}
              </div>

              <!-- バー本体 -->
              <div
                class="w-full max-w-[24px] rounded-t-md relative overflow-hidden transition-all duration-500 hover:opacity-80"
                :style="{
                  height: `${Math.max(barHeight(item.amount), 2)}%`,
                  backgroundColor: color,
                }"
              >
                <div
                  class="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"
                ></div>
              </div>
            </div>

            <!-- ラベル -->
            <div class="h-4 flex items-center justify-center w-full">
              <span
                class="text-[9px] font-bold text-stone-400 truncate w-full text-center"
              >
                {{ item.label }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #e7e5e4 transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e7e5e4;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #d6d3d1;
}
</style>
