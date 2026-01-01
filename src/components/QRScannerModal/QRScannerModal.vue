<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
// ★修正: 同階層のtsファイルをインポート（ファイル名が useQRScannerModal.ts の場合）
import { useQRScannerModal } from "./QRScannerModal";

const emit = defineEmits<{
  (e: "detect", decodedText: string): void;
  (e: "close"): void;
}>();

const { baseModalRef, scannerContainerId, show, close, stopScan } =
  useQRScannerModal(emit);

defineExpose({ show, close });
</script>

<template>
  <BaseModal ref="baseModalRef" @close="stopScan">
    <div class="text-center">
      <h3 class="font-bold text-xl text-stone-800 mb-4">QRコードをスキャン</h3>

      <div
        class="relative overflow-hidden rounded-xl bg-black mb-4 mx-auto w-full aspect-square max-w-[300px]"
      >
        <div :id="scannerContainerId" class="w-full h-full"></div>

        <div
          class="absolute inset-0 border-2 border-teal-400/50 pointer-events-none"
        ></div>
        <div
          class="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse pointer-events-none"
        ></div>
      </div>

      <p class="text-xs text-stone-400 mb-6">
        お客様の会員証QRコードを<br />枠内に映してください
      </p>

      <button
        @click="close"
        class="w-full py-3 rounded-xl font-bold text-stone-500 bg-stone-100 hover:bg-stone-200 transition"
      >
        キャンセル
      </button>
    </div>
  </BaseModal>
</template>

<style>
/* ライブラリの不要なUIを隠す */
#qr-reader video {
  object-fit: cover;
  border-radius: 12px;
}
#qr-reader__scan_region {
  background: transparent !important;
}
#qr-reader__dashboard_section_csr button {
  display: none;
}
</style>
