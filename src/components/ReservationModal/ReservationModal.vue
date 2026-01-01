<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import { useReservationModal, MENU_OPTIONS } from "./ReservationModal";

const emit = defineEmits<{ (e: "saved"): void }>();
const {
  baseModalRef,
  step,
  loading,
  myStylists,
  selectedStylistId,
  selectedDate,
  selectedTime,
  selectedMenu,
  availableSlots,
  minDate,
  show,
  close,
  selectTime,
  nextStep,
  prevStep,
  submitReservation,
  targetCustomer, // 追加
} = useReservationModal(emit);

const onTimeClick = (time: string) => {
  selectTime(time);
};

defineExpose({ show, close });
</script>

<template>
  <BaseModal ref="baseModalRef">
    <div class="px-1 h-full flex flex-col min-h-[450px]">
      <h3 class="font-bold text-xl text-stone-800 mb-2 text-center">WEB予約</h3>

      <!-- 代理予約時の表示 -->
      <div v-if="targetCustomer" class="text-center mb-4">
        <span class="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
          {{ targetCustomer.name }}様の予約を作成中
        </span>
      </div>

      <div v-if="step > 0" class="flex justify-center gap-2 mb-6">
        <div
          v-for="i in 3"
          :key="i"
          class="h-1.5 w-8 rounded-full transition-colors"
          :class="i <= step ? 'bg-teal-500' : 'bg-stone-200'"
        ></div>
      </div>

      <!-- Step 0: 連携なし案内 -->
      <div
        v-if="step === 0"
        class="flex-1 flex flex-col items-center justify-center text-center p-4"
      >
        <div class="text-5xl mb-4">🤝</div>
        <p class="font-bold text-lg text-stone-700 mb-2">
          美容師さんと連携しましょう
        </p>
        <p class="text-sm text-stone-500 mb-6">QRコードで連携してください</p>
        <button
          @click="close"
          class="w-full py-3 mt-4 rounded-xl font-bold bg-stone-100 text-stone-500"
        >
          閉じる
        </button>
      </div>

      <!-- Step 1: 美容師選択 -->
      <div v-else-if="step === 1" class="flex-1">
        <p class="text-sm font-bold text-stone-600 mb-4">担当の美容師を選択</p>
        <div v-if="loading" class="text-center py-4 text-stone-400">
          読み込み中...
        </div>
        <div v-else class="space-y-3">
          <button
            v-for="stylist in myStylists"
            :key="stylist.id"
            @click="
              selectedStylistId = stylist.id;
              nextStep();
            "
            class="w-full p-4 rounded-xl border-2 border-stone-100 flex items-center gap-3 hover:border-teal-500"
          >
            <span class="font-bold text-stone-700">{{
              stylist.name || "担当者"
            }}</span>
          </button>
        </div>
      </div>

      <!-- Step 2: 日時選択 -->
      <div v-else-if="step === 2" class="flex-1 flex flex-col">
        <p class="text-sm font-bold text-stone-600 mb-2">
          日時を選択してください
        </p>

        <div class="mb-4">
          <input
            type="date"
            v-model="selectedDate"
            :min="minDate"
            class="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl font-bold text-stone-700 outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <p class="text-xs font-bold text-stone-400 mb-2">時間を選択</p>

        <div
          v-if="loading"
          class="flex-1 flex items-center justify-center text-stone-400 text-xs py-4"
        >
          <div
            class="animate-spin h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full mr-2"
          ></div>
          空き状況を確認中...
        </div>

        <div
          v-else
          class="grid grid-cols-4 gap-2 overflow-y-auto max-h-[35vh] custom-scrollbar pb-2 content-start"
        >
          <button
            v-for="slot in availableSlots"
            :key="slot.time"
            @click="onTimeClick(slot.time)"
            :disabled="!slot.isAvailable"
            class="py-3 rounded-lg text-sm font-bold transition border"
            :class="[
              selectedTime === slot.time
                ? 'bg-teal-500 text-white border-teal-500 shadow-md ring-2 ring-teal-200'
                : slot.isAvailable
                ? 'bg-white text-stone-600 border-stone-200 hover:border-teal-400 active:scale-95'
                : 'bg-stone-100 text-stone-300 border-transparent cursor-not-allowed opacity-50',
            ]"
          >
            {{ slot.time }}
          </button>

          <div
            v-if="availableSlots.length === 0"
            class="col-span-4 text-center py-8 text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200"
          >
            <p class="text-xs">
              この日の予約枠はありません。<br />別の日付を選択してください。
            </p>
          </div>
        </div>
      </div>

      <!-- Step 3: 確認 -->
      <div v-else-if="step === 3" class="flex-1">
        <div class="bg-stone-50 p-6 rounded-2xl border border-stone-100 mb-6">
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-[10px] text-stone-400 font-bold mb-1">日時</p>
              <p class="text-xl font-bold text-stone-800">
                {{ selectedDate }} {{ selectedTime }}
              </p>
            </div>
            <div>
              <p class="text-[10px] text-stone-400 font-bold mb-1">メニュー</p>
              <div class="relative">
                <select
                  v-model="selectedMenu"
                  class="w-full bg-transparent border-b border-stone-300 py-2 font-bold text-stone-700 outline-none focus:border-teal-500 appearance-none"
                >
                  <option
                    v-for="menu in MENU_OPTIONS"
                    :key="menu"
                    :value="menu"
                  >
                    {{ menu }}
                  </option>
                </select>
                <div
                  class="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs"
                >
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="text-xs text-center text-stone-400">
          この内容で予約を確定しますか？
        </p>
      </div>

      <!-- フッター -->
      <div
        v-if="step > 0"
        class="mt-auto pt-4 flex gap-3 flex-shrink-0 border-t border-stone-100"
      >
        <button
          v-if="step > 1"
          @click="prevStep"
          class="px-6 py-3 rounded-xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200"
        >
          戻る
        </button>

        <button
          v-if="step === 2"
          @click="nextStep"
          class="flex-1 py-3 rounded-xl font-bold text-white transition shadow-sm flex items-center justify-center gap-2"
          :class="
            selectedTime
              ? 'bg-teal-600 hover:bg-teal-700'
              : 'bg-stone-300 cursor-not-allowed'
          "
          :disabled="!selectedTime"
        >
          <span>{{ selectedTime ? "次へ" : "時間を選択してください" }}</span>
          <span v-if="selectedTime">→</span>
        </button>

        <button
          v-if="step === 3"
          @click="submitReservation"
          class="flex-1 py-3 rounded-xl font-bold text-white transition shadow-sm bg-teal-600 hover:bg-teal-700"
          :disabled="loading"
        >
          {{ loading ? "処理中..." : "予約を確定する" }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 4px;
}
</style>
