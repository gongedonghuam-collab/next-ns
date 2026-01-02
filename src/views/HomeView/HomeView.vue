<template>
  <div class="h-screen flex flex-col bg-slate-50 font-sans">
    <header
      class="bg-white px-6 py-6 shadow-sm border-b border-slate-100 flex justify-between items-center flex-shrink-0 z-30"
    >
      <h1
        class="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"
      >
        <span class="bg-blue-600 text-white p-1.5 rounded-xl">Next</span>Ns
      </h1>
      <button
        @click="logout"
        class="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
      >
        ログアウト
      </button>
    </header>

    <main class="flex-1 overflow-y-auto no-scrollbar pb-32">
      <div class="max-w-md mx-auto px-6 mt-8 space-y-6">
        <div v-if="currentTab === 'home'" class="space-y-6 animate-fade-in">
          <div
            class="bg-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-blue-200"
          >
            <div class="flex justify-between items-start mb-6">
              <div>
                <p
                  class="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1"
                >
                  Question Database
                </p>
                <div class="text-4xl font-black">
                  {{ masterQuestions.length
                  }}<span class="text-lg ml-1 opacity-70">問</span>
                </div>
              </div>
              <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-md">📊</div>
            </div>
            <div class="flex justify-between text-xs font-bold mb-2">
              <span>Rank: {{ currentRank }}</span>
              <span>Lv.{{ currentLevel }}</span>
            </div>
            <div class="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                class="h-full bg-white transition-all duration-1000"
                :style="{ width: levelProgress + '%' }"
              ></div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div
              class="bg-white rounded-3xl p-2 border border-slate-100 shadow-sm space-y-1"
            >
              <p
                class="text-[10px] font-black text-slate-400 px-4 pt-2 uppercase tracking-widest"
              >
                Training Mode
              </p>
              <button
                @click="startStudy({ mode: 'random' })"
                class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition group"
              >
                <span class="text-2xl group-hover:scale-110 transition"
                  >🎲</span
                >
                <div class="text-left">
                  <div class="font-black text-slate-800 text-sm">
                    全件ランダム
                  </div>
                  <p class="text-[9px] text-slate-400">
                    登録されているすべての問題から出題
                  </p>
                </div>
              </button>
              <button
                @click="startStudy({ mode: 'random100' })"
                class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition group"
              >
                <span class="text-2xl group-hover:scale-110 transition"
                  >💯</span
                >
                <div class="text-left">
                  <div class="font-black text-slate-800 text-sm">
                    ランダム100問
                  </div>
                  <p class="text-[9px] text-slate-400">
                    実力テストに最適。100問をピックアップ
                  </p>
                </div>
              </button>
            </div>

            <button
              @click="$router.push('/review')"
              class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-left group transition hover:border-orange-200 active:scale-95 flex items-center gap-4"
            >
              <div class="text-2xl group-hover:scale-110 transition">🔄</div>
              <div>
                <div class="font-black text-slate-800">復習モード</div>
                <p class="text-[9px] text-slate-400">
                  苦手集中 ({{ reviewQuestions.length }}問)
                </p>
              </div>
            </button>
          </div>

          <section
            class="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm"
          >
            <div class="flex justify-between items-center mb-4">
              <h2
                class="font-bold text-slate-800 flex items-center gap-2 text-sm"
              >
                📂 データベース診断
              </h2>
              <button
                @click="cleanupDuplicates"
                class="text-[9px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-black border border-orange-100 hover:bg-orange-600 hover:text-white transition"
              >
                重複を一括削除
              </button>
            </div>

            <div class="space-y-6">
              <div
                v-for="stat in questionStats"
                :key="stat.year"
                class="p-4 bg-slate-50 rounded-2xl border border-slate-100"
              >
                <div class="flex justify-between items-center mb-2">
                  <span class="font-black text-slate-800">{{ stat.year }}</span>
                  <span
                    class="text-[10px] font-bold"
                    :class="
                      stat.total === 240 ? 'text-green-500' : 'text-red-500'
                    "
                  >
                    {{ stat.total }} / 240問
                  </span>
                </div>

                <div
                  v-if="dbHealthReport[stat.year]"
                  class="space-y-2 mt-3 pt-3 border-t border-slate-200"
                >
                  <div
                    v-if="dbHealthReport[stat.year].missingAm.length > 0"
                    class="text-[9px] text-red-500 leading-tight"
                  >
                    <span class="font-bold underline">午前不足:</span>
                    {{ dbHealthReport[stat.year].missingAm.join(", ") }}
                  </div>
                  <div
                    v-if="dbHealthReport[stat.year].missingPm.length > 0"
                    class="text-[9px] text-red-500 leading-tight"
                  >
                    <span class="font-bold underline">午後不足:</span>
                    {{ dbHealthReport[stat.year].missingPm.join(", ") }}
                  </div>
                  <div
                    v-if="dbHealthReport[stat.year].duplicates.length > 0"
                    class="text-[9px] text-orange-600 font-bold"
                  >
                    ⚠️ 重複あり:
                    {{ dbHealthReport[stat.year].duplicates.join(", ") }}
                  </div>
                  <div
                    v-if="stat.total === 240"
                    class="text-[9px] text-green-600 font-bold italic"
                  >
                    ✨ 整合性チェック完了
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mt-4">
                  <button
                    @click="
                      startStudy({
                        mode: 'examYear',
                        year: stat.year,
                        period: 'am',
                      })
                    "
                    class="py-2 bg-white border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition active:scale-95"
                  >
                    午前開始 ({{ stat.am }})
                  </button>
                  <button
                    @click="
                      startStudy({
                        mode: 'examYear',
                        year: stat.year,
                        period: 'pm',
                      })
                    "
                    class="py-2 bg-white border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 hover:bg-blue-600 hover:text-white transition active:scale-95"
                  >
                    午後開始 ({{ stat.pm }})
                  </button>
                </div>
              </div>
            </div>
          </section>

          <JsonUploader />
        </div>

        <div
          v-else-if="currentTab === 'history'"
          class="animate-fade-in space-y-6"
        >
          <MyPage />
          <div
            class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
          >
            <h2 class="font-black text-slate-800 mb-4 flex items-center gap-2">
              🔖 保存した問題 ({{ bookmarkedQuestions.length }})
            </h2>
            <div
              v-if="bookmarkedQuestions.length === 0"
              class="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50/50 rounded-2xl border border-dashed"
            >
              保存された問題はまだありません
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="q in bookmarkedQuestions"
                :key="q.id"
                class="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group hover:border-blue-200 transition"
              >
                <div
                  class="flex justify-between text-[9px] font-bold text-slate-400 mb-1"
                >
                  <span>{{ q.examYear }} {{ q.questionNumber }}</span>
                  <button
                    @click="toggleBookmark(q)"
                    class="text-blue-500 hover:text-blue-700 font-bold"
                  >
                    解除
                  </button>
                </div>
                <p
                  class="text-xs font-bold text-slate-700 leading-relaxed line-clamp-3"
                >
                  {{ q.text }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentTab === 'settings'" class="animate-fade-in">
          <SettingsTab :currentUser="currentUser" />
        </div>
      </div>
    </main>

    <TheBottomNav v-model:currentTab="currentTab" class="z-40" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import JsonUploader from "@/components/JsonUploader.vue";
import TheBottomNav from "@/components/TheBottomNav/TheBottomNav.vue";
import MyPage from "@/components/MyPage/MyPage.vue";
import SettingsTab from "@/components/SettingsTab/SettingsTab.vue";

const router = useRouter();
const {
  currentUser,
  masterQuestions,
  questionStats,
  dbHealthReport, // 追加
  reviewQuestions,
  bookmarkedQuestions,
  currentLevel,
  levelProgress,
  currentRank,
  logout,
  toggleBookmark,
  fetchAllQuestions,
  clearSession,
  fetchQuestions,
  selectedPeriod,
  cleanupDuplicates, // 追加
} = useNextNs();

const currentTab = ref("home");

onMounted(() => {
  fetchAllQuestions();
});

const startStudy = async (options: {
  mode: any;
  year?: string;
  period?: "am" | "pm";
}) => {
  clearSession();
  if (options.period) selectedPeriod.value = options.period;

  await fetchQuestions({
    force: true,
    mode: options.mode,
    year: options.year,
    period: options.period,
  });
  router.push("/study");
};
</script>
