<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import BaseButton from "@/uiParts/BaseButton/BaseButton.vue";
import ProductScannerModal from "@/components/ProductScannerModal/ProductScannerModal.vue";
import { useNewLogModal, type NewLogModalProps } from "./NewLogModal";

const props = defineProps<NewLogModalProps>();
const emit = defineEmits<{
  (e: "saved"): void;
}>();

const {
  baseModalRef,
  scannerRef,
  form,
  manualCode,
  selectedFiles,
  previewUrls,
  isSaving,
  isSearchingProduct,
  show,
  close,
  onFileChange,
  removeFile,
  handleSubmit,
  openScanner,
  onProductDetected,
  addManualProduct,
  removeProduct,
  // AI関連
  isAiMode,
  roughNote,
  isAiGenerating,
  generateMagicKarte,
} = useNewLogModal(props, emit);

defineExpose({ show, close });

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-bold text-stone-700 outline-none focus:ring-2 focus:ring-teal-500/20 text-base appearance-none";

const menuOptions = [
  "カット",
  "カラー",
  "カット + カラー",
  "パーマ",
  "カット + パーマ",
  "縮毛矯正",
  "トリートメント",
  "ヘッドスパ",
  "店販のみ",
  "その他",
];
</script>

<template>
  <BaseModal ref="baseModalRef">
    <div v-if="isAiMode" class="px-1 flex flex-col h-full animate-fade-in">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-xl text-indigo-700 flex items-center gap-2">
          <span>🪄</span> Magic Karte
        </h3>
        <button
          @click="isAiMode = false"
          class="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full"
        >
          手動入力へ戻る
        </button>
      </div>

      <p class="text-xs text-stone-500 mb-4 leading-relaxed">
        今日の施術内容や会話を「雑に」メモしてください。<br />
        AIがカルテとお客様へのLINEを自動生成します。
      </p>

      <div class="flex-1">
        <textarea
          v-model="roughNote"
          class="w-full h-48 bg-indigo-50 border border-indigo-200 rounded-xl p-4 font-medium text-stone-700 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          placeholder="例：カットとカラー。アッシュ系。仕事が忙しいらしくて疲れてたからスパも追加。次回はハイライト入れたいって。"
        ></textarea>
      </div>

      <button
        @click="generateMagicKarte"
        :disabled="isAiGenerating || !roughNote"
        class="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-500 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
      >
        <span
          v-if="isAiGenerating"
          class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"
        ></span>
        <span v-else>✨ 生成して入力</span>
      </button>
    </div>

    <div v-else class="px-1 flex flex-col h-full animate-fade-in">
      <div class="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 class="font-bold text-xl text-stone-800">新しい記録を追加</h3>
        <button
          v-if="props.currentUser?.role === 'stylist'"
          @click="isAiMode = true"
          class="text-xs font-bold text-white bg-indigo-600 px-3 py-1.5 rounded-full shadow-md shadow-indigo-200 hover:bg-indigo-500 transition flex items-center gap-1"
        >
          <span>🪄</span> AIで作成
        </button>
      </div>

      <div
        class="flex-1 overflow-y-auto overflow-x-hidden max-h-[80vh] sm:max-h-[60vh] custom-scrollbar space-y-5 pb-4 px-1"
      >
        <div class="w-full">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >来店日</label
          >
          <input type="date" v-model="form.date" :class="inputClass" />
        </div>

        <div class="w-full">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >メニュー</label
          >
          <div class="relative">
            <select v-model="form.menu" :class="inputClass">
              <option value="" disabled selected>メニューを選択</option>
              <option v-for="menu in menuOptions" :key="menu" :value="menu">
                {{ menu }}
              </option>
            </select>
            <div
              class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400 text-xs"
            >
              ▼
            </div>
          </div>
        </div>

        <div class="w-full" v-if="props.currentUser?.role === 'stylist'">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >売上区分</label
          >
          <div class="flex gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              @click="form.salesType = 'tech'"
              class="flex-1 py-2 rounded-lg text-sm font-bold transition"
              :class="
                form.salesType !== 'product'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-stone-400'
              "
            >
              ✂️ 技術売上
            </button>
            <button
              type="button"
              @click="form.salesType = 'product'"
              class="flex-1 py-2 rounded-lg text-sm font-bold transition"
              :class="
                form.salesType === 'product'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-stone-400'
              "
            >
              🧴 店販売上
            </button>
          </div>
        </div>

        <div class="w-full" v-if="props.currentUser?.role === 'stylist'">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >金額 (税込)</label
          >
          <div class="relative w-full">
            <span class="absolute left-4 top-3.5 font-bold text-stone-400"
              >¥</span
            >
            <input
              type="number"
              v-model="form.price"
              :class="[inputClass, 'pl-8']"
              placeholder="0"
            />
          </div>
        </div>

        <div class="w-full" v-if="props.currentUser?.role === 'stylist'">
          <label
            class="block text-xs font-bold text-stone-400 mb-2 flex items-center justify-between"
          >
            <span>使用薬剤・販売商品</span>
            <span
              class="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full"
              >在庫から減算</span
            >
          </label>

          <div class="flex flex-col gap-3">
            <button
              @click="openScanner"
              class="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 font-bold hover:bg-stone-50 hover:border-teal-400 hover:text-teal-500 transition flex items-center justify-center gap-2"
            >
              <span>📷</span> バーコードをスキャン
            </button>

            <div class="flex gap-2">
              <input
                type="text"
                v-model="manualCode"
                placeholder="またはコード手入力"
                :class="[inputClass, 'flex-1 !py-2']"
                @keypress.enter="addManualProduct"
              />
              <button
                @click="addManualProduct"
                class="bg-stone-800 text-white font-bold px-4 rounded-xl hover:bg-stone-700 transition disabled:opacity-50"
                :disabled="!manualCode || isSearchingProduct"
              >
                {{ isSearchingProduct ? "..." : "追加" }}
              </button>
            </div>

            <div v-if="form.products.length > 0" class="space-y-2 mt-1">
              <div
                v-for="(prod, idx) in form.products"
                :key="idx"
                class="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-stone-200 shadow-sm"
              >
                <div class="flex-1 min-w-0 mr-2">
                  <p class="text-xs font-bold text-stone-700 truncate">
                    {{ prod.name }}
                  </p>
                  <p class="text-[10px] text-stone-400 font-mono">
                    {{ prod.code }}
                  </p>
                </div>

                <div class="flex items-center gap-2">
                  <div class="relative w-20">
                    <input
                      type="number"
                      v-model="prod.quantity"
                      step="1"
                      class="w-full bg-stone-50 border border-stone-200 rounded-md px-2 py-1 text-right text-sm font-bold outline-none focus:border-teal-500"
                    />
                    <span
                      class="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 pointer-events-none"
                      >個/ml</span
                    >
                  </div>
                  <button
                    @click="removeProduct(idx)"
                    class="w-8 h-8 flex items-center justify-center bg-stone-100 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-50 transition"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >写真</label
          >
          <label
            class="block w-full border-2 border-dashed border-stone-200 rounded-xl p-4 text-center cursor-pointer hover:bg-stone-50 transition mb-3"
            :class="
              selectedFiles.length > 0 ? 'bg-stone-50 border-teal-300' : ''
            "
          >
            <input
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              @change="onFileChange"
            />
            <span class="text-sm font-bold text-stone-400">
              📷 写真を追加 ({{ selectedFiles.length }}枚)
            </span>
          </label>

          <div
            v-if="previewUrls.length > 0"
            class="flex gap-2 overflow-x-auto pb-2 custom-scrollbar"
          >
            <div
              v-for="(url, index) in previewUrls"
              :key="url"
              class="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-stone-100 group"
            >
              <img :src="url" class="w-full h-full object-cover" />
              <button
                @click="removeFile(index)"
                class="absolute top-1 right-1 w-6 h-6 bg-stone-800/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div class="w-full" v-if="props.currentUser?.role === 'stylist'">
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >技術メモ (カルテ)</label
          >
          <textarea
            v-model="form.memo"
            rows="4"
            :class="[inputClass, 'resize-none']"
            placeholder="施術内容や会話のメモ"
          ></textarea>
        </div>
        <div class="w-full" v-else>
          <label class="block text-xs font-bold text-stone-400 mb-2"
            >メモ (日記)</label
          >
          <textarea
            v-model="form.memo"
            rows="4"
            :class="[inputClass, 'resize-none']"
            placeholder="気に入ったポイントや感想など"
          ></textarea>
        </div>

        <div
          class="w-full bg-green-50 p-4 rounded-xl border border-green-100"
          v-if="props.currentUser?.role === 'stylist'"
        >
          <label
            class="block text-xs font-bold text-green-700 mb-2 flex items-center gap-1"
          >
            <span>💬</span> 自動送信されるLINE
          </label>
          <textarea
            v-model="form.customLineMessage"
            rows="4"
            class="w-full bg-white border border-green-200 rounded-lg p-3 text-sm text-stone-600 outline-none focus:ring-2 focus:ring-green-400/30 resize-none"
            placeholder="定型文が送信されます（AI生成時はここに文章が入ります）"
          ></textarea>
          <p class="text-[9px] text-green-600 mt-2 text-right">
            ※ 空欄の場合は設定済みの定型文が送られます
          </p>
        </div>
      </div>

      <div class="pt-2 mt-auto flex-shrink-0 w-full">
        <BaseButton
          @click="handleSubmit"
          variant="primary"
          :disabled="isSaving"
          class="w-full !bg-stone-800 !hover:bg-stone-700 !border-stone-800 !text-base !py-3"
        >
          <template v-if="isSaving"> 保存中... </template>
          <template v-else>
            {{
              props.currentUser?.role === "stylist"
                ? "保存してLINE送信"
                : "記録を保存"
            }}
          </template>
        </BaseButton>
      </div>
    </div>

    <ProductScannerModal ref="scannerRef" @detect="onProductDetected" />
  </BaseModal>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d6d3d1;
  border-radius: 4px;
}
</style>
