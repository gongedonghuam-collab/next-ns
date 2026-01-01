<script setup lang="ts">
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue";
import BaseButton from "@/uiParts/BaseButton/BaseButton.vue";
import ProductScannerModal from "@/components/ProductScannerModal/ProductScannerModal.vue";
import { useInventoryDashboard } from "./InventoryDashboard";

const {
  filteredProducts,
  searchText,
  form,
  isEditing,
  scannerRef,
  editModalRef,
  openAddModal,
  openEditModal,
  openScanner,
  scanForForm,
  onScan,
  saveItem,
  deleteItem,
} = useInventoryDashboard();

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 font-bold text-stone-700 outline-none focus:ring-2 focus:ring-teal-500/20 text-base appearance-none";
</script>

<template>
  <div class="pb-24">
    <div class="mb-6 px-1">
      <div class="flex justify-between items-end mb-4">
        <h2 class="font-bold text-stone-700 text-lg flex items-center gap-2">
          <span class="w-1.5 h-6 rounded-full bg-teal-600"></span>
          在庫管理
        </h2>
        <span class="text-xs font-bold text-stone-400"
          >{{ filteredProducts.length }} アイテム</span
        >
      </div>

      <div class="flex gap-2">
        <div class="relative flex-1">
          <input
            v-model="searchText"
            placeholder="商品名やコードで検索..."
            class="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-stone-600 outline-none focus:border-teal-500"
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            >🔍</span
          >
        </div>
        <button
          @click="openScanner"
          class="w-12 h-12 bg-stone-800 rounded-xl text-white flex items-center justify-center text-xl shadow-md hover:bg-stone-700 transition"
        >
          📷
        </button>
        <button
          @click="openAddModal"
          class="w-12 h-12 bg-teal-500 rounded-xl text-white flex items-center justify-center text-2xl shadow-md hover:bg-teal-600 transition"
        >
          +
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="item in filteredProducts"
        :key="item.code"
        @click="openEditModal(item)"
        class="bg-white p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between active:scale-[0.99]"
        :class="
          item.stock < 3
            ? 'border-red-200 bg-red-50/30'
            : 'border-stone-100 shadow-sm'
        "
      >
        <div class="flex-1 min-w-0 mr-4">
          <p class="font-bold text-stone-800 truncate mb-1">{{ item.name }}</p>
          <div class="flex gap-2 text-[10px]">
            <span
              class="text-stone-400 font-mono bg-stone-50 px-1.5 py-0.5 rounded"
              >{{ item.code }}</span
            >
            <span
              class="text-stone-500 font-bold bg-stone-50 px-1.5 py-0.5 rounded"
            >
              @¥{{ (item.unitPrice || 0).toLocaleString() }}
            </span>
          </div>
        </div>

        <div class="text-right">
          <p class="text-[10px] text-stone-400 mb-0.5">在庫数</p>
          <div class="flex flex-col items-end">
            <p
              class="text-xl font-bold"
              :class="item.stock < 3 ? 'text-red-500' : 'text-teal-600'"
            >
              {{ item.stock }}
            </p>
            <span
              v-if="item.stock < 3"
              class="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse mt-1"
            >
              🚨 発注
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="filteredProducts.length === 0"
        class="text-center py-12 text-stone-400"
      >
        <p class="text-4xl mb-2">📦</p>
        <p class="text-xs font-bold">在庫データがありません</p>
      </div>
    </div>

    <BaseModal ref="editModalRef">
      <div class="px-1">
        <div class="flex justify-between items-center mb-6">
          <h3 class="font-bold text-xl text-stone-800">
            {{ isEditing ? "在庫を編集" : "商品を登録" }}
          </h3>
          <button
            v-if="isEditing"
            @click="
              deleteItem(form.code);
              editModalRef?.close();
            "
            class="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-full"
          >
            削除
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-xs font-bold text-stone-400 mb-2"
              >バーコード (JAN)</label
            >
            <div class="flex gap-2">
              <input
                type="text"
                v-model="form.code"
                :class="[
                  inputClass,
                  isEditing ? 'bg-stone-100 text-stone-400' : '',
                ]"
                :disabled="isEditing"
                placeholder="スキャンまたは入力"
                class="flex-1"
              />
              <button
                v-if="!isEditing"
                @click="scanForForm"
                class="w-12 h-[50px] bg-stone-100 rounded-xl text-xl flex items-center justify-center hover:bg-stone-200 transition"
              >
                📷
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-stone-400 mb-2"
              >商品名</label
            >
            <input
              type="text"
              v-model="form.name"
              :class="inputClass"
              placeholder="商品名を入力"
            />
          </div>

          <div class="flex gap-4">
            <div class="flex-1">
              <label class="block text-xs font-bold text-stone-400 mb-2"
                >在庫数</label
              >
              <div class="flex items-center gap-2">
                <button
                  @click="form.stock--"
                  class="w-10 h-[50px] rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200"
                >
                  -
                </button>
                <input
                  type="number"
                  v-model="form.stock"
                  :class="[inputClass, 'text-center !px-0']"
                />
                <button
                  @click="form.stock++"
                  class="w-10 h-[50px] rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200"
                >
                  +
                </button>
              </div>
            </div>

            <div class="flex-1">
              <label class="block text-xs font-bold text-stone-400 mb-2"
                >仕入れ単価 (円)</label
              >
              <input
                type="number"
                v-model="form.unitPrice"
                :class="inputClass"
                placeholder="0"
              />
            </div>
          </div>

          <div class="pt-4">
            <BaseButton
              @click="saveItem"
              variant="primary"
              class="w-full !bg-stone-800 !hover:bg-stone-700 !py-3"
            >
              保存する
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseModal>

    <ProductScannerModal ref="scannerRef" @detect="onScan" />
  </div>
</template>

<style>
#product-barcode-reader video {
  object-fit: cover;
  border-radius: 12px;
}
</style>
