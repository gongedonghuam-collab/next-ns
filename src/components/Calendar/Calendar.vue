<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps<{
  events: any[];
}>();

const emit = defineEmits(["event-click"]);

// 表示中の基準日（初期値は今日）
const viewingDate = ref(new Date());

const currentYear = computed(() => viewingDate.value.getFullYear());
const currentMonth = computed(() => viewingDate.value.getMonth() + 1);

// 前月へ
const prevMonth = () => {
  viewingDate.value = new Date(currentYear.value, currentMonth.value - 2, 1);
};

// 次月へ
const nextMonth = () => {
  viewingDate.value = new Date(currentYear.value, currentMonth.value, 1);
};

// カレンダーの日付セル生成
const calendarCells = computed(() => {
  const year = currentYear.value;
  const month = currentMonth.value - 1; // 0-indexed

  // 月の最初の日と最後の日
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const cells = [];

  // 1日の曜日までの空白セル (0:Sun, 1:Mon...)
  for (let i = 0; i < firstDay.getDay(); i++) {
    cells.push({ day: null, date: "", events: [] });
  }

  // 日付セル
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      i
    ).padStart(2, "0")}`;
    // その日のイベントを抽出
    const dayEvents = props.events.filter((e) => e.date === dateStr);
    cells.push({ day: i, date: dateStr, events: dayEvents });
  }

  return cells;
});

const handleEventClick = (event: any) => {
  emit("event-click", event);
};
</script>

<template>
  <div class="bg-white rounded-3xl p-4 shadow-sm border border-stone-100">
    <!-- ヘッダー：月切り替え -->
    <div class="flex justify-between items-center mb-4 px-2">
      <button
        @click="prevMonth"
        class="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
      >
        &lt;
      </button>
      <h3 class="font-bold text-lg text-stone-700 select-none">
        {{ currentYear }}年 {{ currentMonth }}月
      </h3>
      <button
        @click="nextMonth"
        class="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
      >
        &gt;
      </button>
    </div>

    <!-- 曜日ヘッダー -->
    <div class="grid grid-cols-7 gap-1 text-center mb-2">
      <div class="text-xs font-bold text-red-400">日</div>
      <div class="text-xs font-bold text-stone-400">月</div>
      <div class="text-xs font-bold text-stone-400">火</div>
      <div class="text-xs font-bold text-stone-400">水</div>
      <div class="text-xs font-bold text-stone-400">木</div>
      <div class="text-xs font-bold text-stone-400">金</div>
      <div class="text-xs font-bold text-blue-400">土</div>
    </div>

    <!-- カレンダー本体 -->
    <div class="grid grid-cols-7 gap-1">
      <div
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        class="min-h-[60px] border rounded-lg p-1 flex flex-col items-center relative transition"
        :class="
          cell.day
            ? 'border-stone-50 bg-white'
            : 'border-transparent bg-transparent'
        "
      >
        <template v-if="cell.day">
          <span class="text-sm font-bold text-stone-600 mb-1">{{
            cell.day
          }}</span>

          <!-- イベントリスト -->
          <div class="w-full flex flex-col gap-1">
            <button
              v-for="(event, eIdx) in cell.events"
              :key="eIdx"
              @click.stop="handleEventClick(event)"
              class="w-full text-[9px] text-white bg-teal-500 rounded px-1 py-0.5 truncate text-left shadow-sm hover:bg-teal-600 transition block"
            >
              {{ event.title }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
