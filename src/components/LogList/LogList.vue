<script setup lang="ts">
import { ref } from "vue";
import { useHairLink } from "@/composables/useHairLink"; // ★追加: 直接データを取得

const props = defineProps<{
  logs: any[];
}>();

defineEmits(["delete"]);

// ★追加: グローバルのユーザー情報を直接参照
const { currentUser } = useHairLink();

const imageModalUrl = ref<string | null>(null);

const getLogImages = (log: any): string[] => {
  if (
    log.imageUrls &&
    Array.isArray(log.imageUrls) &&
    log.imageUrls.length > 0
  ) {
    return log.imageUrls;
  } else if (log.imageUrl) {
    return [log.imageUrl];
  }
  return [];
};
</script>

<template>
  <div class="relative space-y-8 pl-4">
    <div
      class="absolute left-[7px] top-4 bottom-4 w-[2px] bg-stone-100 rounded-full"
    ></div>

    <template v-if="logs && logs.length > 0">
      <div v-for="log in logs" :key="log.id" class="relative pl-6 group">
        <div
          class="absolute left-[-1px] top-6 w-4 h-4 bg-white border-4 border-stone-200 rounded-full z-10 group-hover:border-teal-400 transition-colors"
        ></div>

        <div
          class="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 relative transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <button
            v-if="
              currentUser?.role === 'stylist' ||
              (currentUser?.uid && log.authorId === currentUser.uid)
            "
            @click.stop="$emit('delete', log.id)"
            class="absolute top-3 right-3 z-50 p-2 bg-stone-50 text-stone-300 rounded-full hover:bg-red-50 hover:text-red-500 transition border border-transparent hover:border-red-100 shadow-sm"
            title="削除する"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>

          <div class="flex items-center justify-between mb-4 pr-10">
            <p class="text-xs font-bold text-stone-500 font-mono">
              {{ log.date }}
            </p>
            <p
              class="text-[9px] font-bold text-stone-400 border border-stone-100 px-2 py-0.5 rounded-full mr-4"
            >
              {{ log.authorName || "Staff" }}
            </p>
          </div>

          <div class="mb-4">
            <h3 class="font-bold text-lg text-stone-800 mb-0.5">
              {{ log.menu }}
            </h3>
            <p class="text-sm font-bold text-stone-500">
              ¥{{ Number(log.price).toLocaleString() }}
            </p>
          </div>

          <div
            v-if="getLogImages(log).length > 0"
            class="mb-4 -mx-5 bg-stone-50/50 py-3"
          >
            <div
              class="flex overflow-x-auto snap-x snap-mandatory custom-scrollbar px-5 gap-3"
            >
              <div
                v-for="(url, idx) in getLogImages(log)"
                :key="idx"
                class="snap-center flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-stone-200 relative cursor-pointer hover:opacity-90 transition"
                @click="imageModalUrl = url"
              >
                <img :src="url" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div
            v-if="log.memo"
            class="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed"
          >
            {{ log.memo }}
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center py-10 text-stone-300 ml-[-1rem]">
      <p class="text-4xl mb-3 opacity-30">📝</p>
      <p class="text-xs font-bold">No History</p>
    </div>

    <div
      v-if="imageModalUrl"
      class="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
      @click="imageModalUrl = null"
    >
      <img
        :src="imageModalUrl"
        class="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
      />
      <button
        class="absolute top-6 right-6 text-white/80 text-4xl font-bold hover:text-white"
      >
        &times;
      </button>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
