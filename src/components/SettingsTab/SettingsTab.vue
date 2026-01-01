<script setup lang="ts">
import { ref, watch } from "vue";
import { getAuth, updateProfile } from "firebase/auth";
import BaseInput from "@/uiParts/BaseInput/BaseInput.vue";
import type { User } from "@/types";

// Props定義から THEMES, currentTheme を削除しました
const props = defineProps<{
  currentUser: User | null;
}>();

const emit = defineEmits(["saved"]);

const editName = ref("");
const isSaving = ref(false);

// 初期値をセット
watch(
  () => props.currentUser,
  (newVal) => {
    if (newVal) {
      editName.value = newVal.displayName || "";
    }
  },
  { immediate: true }
);

const handleSave = async () => {
  const auth = getAuth();
  if (!auth.currentUser) return;

  isSaving.value = true;
  try {
    // Firebase Authのプロフィール更新
    await updateProfile(auth.currentUser, {
      displayName: editName.value,
    });
    alert("プロフィールを更新しました✨");
    emit("saved");
  } catch (e) {
    console.error(e);
    alert("保存に失敗しました");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="pb-24 space-y-6 animate-fade-in">
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h3 class="font-bold text-slate-800 text-lg mb-6">アカウント設定</h3>

      <div class="mb-6">
        <label
          class="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider"
          >お名前</label
        >
        <BaseInput v-model="editName" placeholder="表示名を入力" />
      </div>

      <button
        @click="handleSave"
        :disabled="isSaving"
        class="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg active:scale-95 disabled:opacity-50"
      >
        {{ isSaving ? "保存中..." : "変更を保存" }}
      </button>
    </div>

    <div class="text-center">
      <p class="text-xs text-slate-400">NextNs v1.0.0</p>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
