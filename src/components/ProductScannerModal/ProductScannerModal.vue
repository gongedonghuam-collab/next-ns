<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import { ProductScannerModal } from "./ProductScannerModal";

const emit = defineEmits<{
  (e: "detect", code: string): void;
  (e: "close"): void;
}>();

const { baseModalRef, scannerContainerId, show, close, stopScan } =
  ProductScannerModal(emit);

defineExpose({ show, close });
</script>

<template>
  <BaseModal ref="baseModalRef" @close="stopScan">
    <div class="text-center">
      <h3 class="font-bold text-xl text-stone-800 mb-4">
        商品バーコードをスキャン
      </h3>

      <div
        class="relative overflow-hidden rounded-xl bg-black mb-4 mx-auto w-full aspect-square max-w-[300px]"
      >
        <div :id="scannerContainerId" class="w-full h-full"></div>

        <!-- スキャン枠の装飾（バーコード用） -->
        <div
          class="absolute inset-0 m-auto w-[80%] h-[100px] border-2 border-red-400/80 pointer-events-none rounded-lg"
        ></div>
        <div
          class="absolute top-1/2 left-0 w-full h-0.5 bg-red-500/50 animate-pulse pointer-events-none"
        ></div>
      </div>

      <p class="text-xs text-stone-400 mb-6">
        カラー剤やシャンプーの<br />バーコードを枠内に映してください
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
#product-barcode-reader video {
  object-fit: cover;
  border-radius: 12px;
}
</style>
