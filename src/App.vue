<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getAuth, onAuthStateChanged } from "firebase/auth";
// ▼ 追加
import { seedQuestionsToFirestore } from "@/seed/seeder";

const auth = getAuth();
const isLoading = ref(true);

onMounted(() => {
  const safetyTimer = setTimeout(() => {
    if (isLoading.value) {
      isLoading.value = false;
    }
  }, 3000);

  onAuthStateChanged(auth, (user) => {
    clearTimeout(safetyTimer);
    isLoading.value = false;
  });
});
</script>

<template>
  <div
    v-if="isLoading"
    class="min-h-screen flex items-center justify-center bg-[#0c0a09] relative z-40"
  >
    <div
      class="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"
    ></div>
  </div>

  <router-view v-else />

  <button
    @click="seedQuestionsToFirestore"
    class="fixed bottom-4 left-4 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
  >
    DB Seed
  </button>
</template>
