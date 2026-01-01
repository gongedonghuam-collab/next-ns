<script setup lang="ts">
import { onMounted } from "vue";
import { useNextNs } from "@/composables/useNextNs";

const { initAuth } = useNextNs();

onMounted(() => {
  initAuth(); // 認証監視スタート
});
</script>

<template>
  <router-view />
</template>
