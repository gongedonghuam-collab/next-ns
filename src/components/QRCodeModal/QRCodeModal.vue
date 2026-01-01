<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import { useQRCodeModal, type QRCodeModalProps } from "./QRCodeModal";

const props = defineProps<QRCodeModalProps>();
const emit = defineEmits(["close"]);

// ロジックの使用
const { baseModalRef, show, close, getQRUrl } = useQRCodeModal(emit);

// 親から制御できるように公開
defineExpose({ show, close });
</script>

<template>
  <!-- BaseModalのcloseイベントもハンドリングする -->
  <BaseModal ref="baseModalRef" @close="close">
    <div class="text-center px-2 py-4">
      <h3 class="font-bold text-xl text-stone-800 mb-2">マイQRコード</h3>
      <p class="text-xs text-stone-400 mb-8">美容師さんに提示してください</p>

      <div class="flex justify-center mb-8">
        <div class="p-4 bg-white border-4 border-stone-100 rounded-3xl">
          <!-- ロジック内の関数を使用してURL生成 -->
          <img
            v-if="uid"
            :src="getQRUrl(uid)"
            alt="My QR Code"
            class="w-48 h-48 object-contain opacity-90"
          />
          <div
            v-else
            class="w-48 h-48 bg-stone-100 flex items-center justify-center rounded-xl text-stone-400 text-xs"
          >
            ID読み込み中...
          </div>
        </div>
      </div>

      <button
        @click="close"
        class="w-full py-3 rounded-xl font-bold text-rose-500 border border-rose-100 hover:bg-rose-50 transition"
      >
        閉じる
      </button>
    </div>
  </BaseModal>
</template>
