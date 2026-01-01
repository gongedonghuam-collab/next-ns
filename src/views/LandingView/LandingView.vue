<script setup lang="ts">
import { useRouter } from "vue-router";
import { onMounted } from "vue";

const router = useRouter();

const goToLogin = () => {
  router.push("/login");
};

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".fade-in-section").forEach((section) => {
    observer.observe(section);
  });
});
</script>

<template>
  <div
    class="bg-[#F8FAFC] text-slate-800 font-sans overflow-x-hidden selection:bg-slate-900 selection:text-white"
  >
    <nav
      class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16"
    >
      <div
        class="max-w-6xl mx-auto px-6 h-full flex justify-between items-center"
      >
        <div class="font-bold text-xl tracking-tight flex items-center gap-2">
          <div
            class="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs"
          >
            H
          </div>
          <span class="text-slate-900 font-extrabold">HairLink</span>
        </div>
        <button
          @click="goToLogin"
          class="text-xs font-bold bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-300/50"
        >
          ログイン / 登録
        </button>
      </div>
    </nav>

    <header
      class="relative min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-20"
    >
      <div class="max-w-5xl mx-auto space-y-8 relative z-10">
        <span
          class="inline-block py-1.5 px-4 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 tracking-wider mb-6 shadow-sm"
        >
          AI搭載・美容師と顧客をつなぐ次世代OS
        </span>
        <h1
          class="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-slate-900"
        >
          美容師とお客様の<br />
          <span class="text-teal-600">距離を、もっと近くに。</span>
        </h1>
        <p
          class="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
        >
          24時間いつでもWeb予約。過去のスタイルもAIが管理。あなたがハサミを置いた後のすべてのやり取りを、HairLinkがスマートにします。
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            @click="goToLogin"
            class="px-8 py-4 font-bold text-white bg-slate-900 rounded-full hover:bg-slate-800 transition shadow-xl text-base group"
          >
            今すぐ無料で体験する →
          </button>
        </div>

        <div
          class="mt-20 relative mx-auto w-full max-w-[320px] h-[640px] bg-slate-800 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden"
        >
          <div
            class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50"
          ></div>
          <div class="w-full h-full bg-slate-50 overflow-y-auto">
            <div class="p-4 pt-10">
              <div
                class="w-full h-32 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-4 text-white text-left mb-6"
              >
                <p class="text-[8px] opacity-80 uppercase font-bold">
                  Next Reservation
                </p>
                <p class="text-xl font-bold mt-1">12/24 14:00</p>
                <p class="text-[10px] mt-1">Cut + Color / Omotesando</p>
              </div>
              <div class="space-y-3">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="w-full h-24 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center p-3"
                >
                  <div class="w-12 h-12 bg-slate-100 rounded-lg mr-3"></div>
                  <div class="flex-1">
                    <div class="h-2 w-20 bg-slate-200 rounded mb-2"></div>
                    <div class="h-2 w-32 bg-slate-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="absolute bottom-4 left-4 right-4 h-12 bg-white/80 backdrop-blur rounded-full shadow-lg border border-white flex justify-around items-center"
            >
              <div class="w-2 h-2 bg-teal-500 rounded-full"></div>
              <div class="w-2 h-2 bg-slate-200 rounded-full"></div>
              <div class="w-2 h-2 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </header>

    <section class="py-24 bg-slate-900 text-white">
      <div class="max-w-4xl mx-auto px-6">
        <h2 class="text-center text-3xl font-black mb-16">
          HairLinkでできること
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div class="flex gap-4">
            <div class="text-3xl">📅</div>
            <div>
              <h4 class="font-bold text-xl mb-2">24h リアルタイム予約</h4>
              <p class="text-slate-400 text-sm">
                美容師の空き時間を自動計算。ダブルブッキングの心配なしに、お客様が好きな時に予約を入れられます。
              </p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="text-3xl">🤳</div>
            <div>
              <h4 class="font-bold text-xl mb-2">共有デジタルカルテ</h4>
              <p class="text-slate-400 text-sm">
                お客様も自分の施術履歴を確認可能。「いつもの」がもっと正確に、よりスムーズに伝わります。
              </p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="text-3xl">🪄</div>
            <div>
              <h4 class="font-bold text-xl mb-2">AI スタイル提案</h4>
              <p class="text-slate-400 text-sm">
                AIが次回の来店目安やおすすめのメニューを自動でプッシュ通知。リピート率向上をサポート。
              </p>
            </div>
          </div>
          <div class="flex gap-4">
            <div class="text-3xl">💰</div>
            <div>
              <h4 class="font-bold text-xl mb-2">手数料ゼロ</h4>
              <p class="text-slate-400 text-sm">
                大手予約サイトのような高額な送客手数料は一切不要。月額プランのみで利益を最大化。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
