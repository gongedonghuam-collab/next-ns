<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHairLink } from "@/composables/useHairLink";

const route = useRoute();
const router = useRouter();
const { getStylistPublicProfile } = useHairLink();

const stylistId = route.params.stylistId as string;
const stylist = ref<any>(null);
const loading = ref(true);
const hasError = ref(false);

const THEMES: Record<string, any> = {
  teal: {
    bg: "from-teal-500 to-emerald-600",
    text: "text-teal-600",
    button: "bg-teal-600 hover:bg-teal-700",
    light: "bg-teal-50 text-teal-700",
  },
  rose: {
    bg: "from-rose-400 to-orange-400",
    text: "text-rose-500",
    button: "bg-rose-500 hover:bg-rose-600",
    light: "bg-rose-50 text-rose-700",
  },
  blue: {
    bg: "from-blue-500 to-indigo-600",
    text: "text-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
    light: "bg-blue-50 text-blue-700",
  },
  stone: {
    bg: "from-stone-600 to-stone-800",
    text: "text-stone-600",
    button: "bg-stone-800 hover:bg-stone-700",
    light: "bg-stone-100 text-stone-700",
  },
};

const currentTheme = computed(() => {
  const key = stylist.value?.themeColor || "teal";
  return THEMES[key] || THEMES["teal"];
});

onMounted(async () => {
  if (stylistId) {
    try {
      stylist.value = await getStylistPublicProfile(stylistId);
    } catch (e) {
      hasError.value = true;
    }
  } else {
    hasError.value = true;
  }
  loading.value = false;
});

const goToBooking = () => {
  router.push("/login");
};
</script>

<template>
  <div
    v-if="loading"
    class="min-h-screen flex items-center justify-center bg-stone-50"
  >
    <div
      class="animate-spin w-8 h-8 border-2 border-stone-300 border-t-stone-600 rounded-full"
    ></div>
  </div>

  <div
    v-else-if="!stylist || hasError"
    class="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center"
  >
    <p class="text-4xl mb-4">😢</p>
    <h2 class="font-bold text-stone-700 mb-2">ページが見つかりません</h2>
    <p class="text-sm text-stone-500">
      URLが間違っているか、削除された可能性があります。
    </p>
  </div>

  <div v-else class="min-h-screen bg-stone-50 font-sans pb-20">
    <div class="relative h-48 w-full bg-stone-200 overflow-hidden">
      <img
        v-if="stylist.headerImgUrl"
        :src="stylist.headerImgUrl"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-r"
        :class="currentTheme.bg"
      ></div>
      <div class="absolute inset-0 bg-black/10"></div>
    </div>

    <div class="px-6 -mt-16 relative z-10 text-center">
      <div
        class="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-lg overflow-hidden bg-white"
      >
        <img
          v-if="stylist.profileImgUrl"
          :src="stylist.profileImgUrl"
          class="w-full h-full object-cover"
        />
        <div
          v-else
          class="w-full h-full bg-stone-100 flex items-center justify-center text-4xl"
        >
          ✂️
        </div>
      </div>

      <div class="mt-4">
        <h1 class="text-2xl font-bold text-stone-800 tracking-tight">
          {{ stylist.name }}
        </h1>
        <p
          v-if="stylist.salonName"
          class="text-sm font-bold text-stone-400 mt-1"
        >
          {{ stylist.salonName }}
        </p>
      </div>

      <div
        v-if="stylist.bio"
        class="mt-6 text-sm text-stone-600 leading-relaxed bg-white p-4 rounded-2xl shadow-sm border border-stone-100 text-left whitespace-pre-wrap"
      >
        {{ stylist.bio }}
      </div>

      <div class="flex justify-center gap-4 mt-6">
        <a
          v-if="stylist.instagram"
          :href="`https://instagram.com/${stylist.instagram.replace('@', '')}`"
          target="_blank"
          class="w-12 h-12 bg-white rounded-full shadow-sm border border-stone-100 flex items-center justify-center text-2xl hover:scale-110 transition"
          >📸</a
        >
        <a
          v-if="stylist.tiktok"
          :href="`https://tiktok.com/@${stylist.tiktok.replace('@', '')}`"
          target="_blank"
          class="w-12 h-12 bg-white rounded-full shadow-sm border border-stone-100 flex items-center justify-center text-2xl hover:scale-110 transition"
          >🎵</a
        >
      </div>

      <div
        class="mt-10 fixed bottom-6 left-6 right-6 z-50 md:relative md:bottom-auto md:max-w-sm md:mx-auto"
      >
        <button
          @click="goToBooking"
          class="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-xl shadow-stone-300/50 transform transition active:scale-95 flex items-center justify-center gap-2"
          :class="currentTheme.button"
        >
          <span>📅</span> 今すぐ予約する
        </button>
      </div>
    </div>

    <div class="mt-12 px-6 max-w-md mx-auto">
      <h3 class="text-xs font-bold text-stone-400 mb-3 text-center">ACCESS</h3>
      <div
        class="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 h-40 flex items-center justify-center text-stone-400 text-sm"
      >
        <p>📍 Google Map 連携予定</p>
      </div>
    </div>

    <div class="mt-12 text-center">
      <p class="text-[10px] text-stone-400 font-bold">Powered by HairLink</p>
    </div>
  </div>
</template>
