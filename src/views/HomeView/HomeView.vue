<template>
  <div class="h-screen flex flex-col bg-slate-50 font-sans">
    <header
      v-if="currentTab !== 'ranking'"
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

    <main
      class="flex-1 overflow-y-auto no-scrollbar"
      :class="currentTab === 'ranking' ? 'pb-24 p-0' : 'pb-32 px-6 pt-8'"
    >
      <div class="max-w-md mx-auto h-full">
        <div v-if="currentTab === 'home'" class="space-y-8 animate-fade-in">
          <div v-if="hasResumeData" class="animate-fade-in">
            <button
              @click="$router.push('/study')"
              class="w-full bg-slate-800 text-white p-4 rounded-3xl shadow-lg flex items-center justify-between group active:scale-95 transition"
            >
              <div class="text-left">
                <p
                  class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1"
                >
                  RESUME
                </p>
                <p class="font-bold">前回の続きから再開する</p>
              </div>
              <span class="text-2xl group-hover:translate-x-1 transition"
                >▶</span
              >
            </button>
          </div>

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

          <button
            @click="$router.push('/mock-exam')"
            class="w-full bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 text-white shadow-xl shadow-orange-200 relative overflow-hidden group active:scale-95 transition"
            :class="{
              'animate-pulse ring-4 ring-orange-300 ring-offset-2':
                shouldNotifyMock,
            }"
          >
            <div class="relative z-10 flex justify-between items-center">
              <div>
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/20 inline-block"
                  >
                    EVENT
                  </span>
                  <span
                    v-if="shouldNotifyMock"
                    class="bg-yellow-400 text-orange-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce"
                  >
                    NOW OPEN!
                  </span>
                </div>
                <h3 class="font-black text-xl">全国統一模試</h3>
                <p class="text-xs font-bold text-orange-100 mt-1">
                  {{
                    shouldNotifyMock
                      ? "⚠️ まだ回答していません！"
                      : "実力を試して判定をチェック！"
                  }}
                </p>
              </div>
              <div class="text-4xl group-hover:scale-110 transition">📊</div>
            </div>
            <div class="absolute -bottom-10 -left-4 text-9xl opacity-10">
              📝
            </div>
          </button>

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
                @click="startStudy({ mode: 'random100' })"
                class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition group"
              >
                <span class="text-2xl group-hover:scale-110 transition"
                  >🎲</span
                >
                <div class="text-left">
                  <div class="font-black text-slate-800 text-sm">
                    ランダム演習 (100問)
                  </div>
                  <p class="text-[9px] text-slate-400">
                    全範囲からランダムに出題。実力試しに最適です。
                  </p>
                </div>
                <div class="ml-auto text-slate-300 text-xl">→</div>
              </button>

              <button
                @click="$router.push('/review')"
                class="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition group"
              >
                <span class="text-2xl group-hover:scale-110 transition"
                  >🔄</span
                >
                <div class="text-left">
                  <div class="font-black text-slate-800 text-sm">
                    復習モード
                  </div>
                  <p class="text-[9px] text-slate-400">
                    間違えた問題や自信のない問題を重点的に
                  </p>
                </div>
                <div class="ml-auto text-slate-300 text-xl">→</div>
              </button>
            </div>
          </div>

          <div
            class="bg-white rounded-3xl pt-5 pb-2 px-2 border border-slate-100 shadow-sm"
          >
            <div class="flex items-center gap-2 mb-4 px-3">
              <span class="text-xl">📚</span>
              <div>
                <h2 class="font-black text-slate-800 text-sm">
                  出題年度を選択
                </h2>
                <p class="text-[10px] text-slate-400">
                  ※合格基準点と比較して判定します
                </p>
              </div>
            </div>

            <div class="divide-y divide-slate-100">
              <div
                v-for="stat in yearStatsList"
                :key="stat.year"
                class="flex items-center justify-between p-3 hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer rounded-xl group"
                @click="openYearModal(stat.year)"
              >
                <div class="flex-shrink-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-black text-slate-700 text-lg">
                      {{ stat.year }}
                    </p>
                    <span
                      class="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200"
                      >午前・午後</span
                    >
                  </div>

                  <div class="text-[9px] font-bold text-slate-400 mb-1.5">
                    🏁 ボーダー: 必修{{ stat.border.mandatory }} / 一般{{
                      stat.border.general
                    }}
                  </div>

                  <div v-if="stat.answeredCount === 0">
                    <span
                      class="text-[10px] font-bold text-slate-300 bg-slate-100 px-2 py-0.5 rounded-full"
                    >
                      未回答
                    </span>
                  </div>

                  <div
                    v-else-if="stat.answeredCount < stat.totalCount"
                    class="mt-1"
                  >
                    <span
                      class="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200"
                    >
                      🏃 回答中
                      {{
                        Math.round(
                          (stat.answeredCount / stat.totalCount) * 100
                        )
                      }}%
                    </span>
                  </div>

                  <div v-else class="mt-1">
                    <span
                      v-if="stat.isPassed"
                      class="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full border border-green-200"
                    >
                      💮 合格圏
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200"
                    >
                      ⚠️ 要復習
                    </span>
                  </div>
                </div>

                <div class="text-right flex-1 mx-4">
                  <div class="flex justify-end items-baseline gap-1 mb-2">
                    <span class="text-[10px] text-slate-400 font-bold"
                      >解答済</span
                    >
                    <span class="font-black text-slate-700">{{
                      stat.answeredCount
                    }}</span>
                    <span class="text-[10px] text-slate-400"
                      >/ {{ stat.totalCount }}問</span
                    >
                  </div>

                  <div
                    class="flex flex-col items-end gap-1 text-[10px] font-bold"
                  >
                    <div
                      :class="
                        stat.mandatoryScore >= stat.border.mandatory
                          ? 'text-green-600'
                          : 'text-red-500'
                      "
                    >
                      必修
                      <span class="text-sm font-black">{{
                        stat.mandatoryScore
                      }}</span>
                      <span class="text-[9px] text-slate-400 opacity-70"
                        >/50</span
                      >
                    </div>
                    <div
                      :class="
                        stat.generalScore >= stat.border.general
                          ? 'text-green-600'
                          : 'text-red-500'
                      "
                    >
                      一般
                      <span class="text-sm font-black">{{
                        stat.generalScore
                      }}</span>
                      <span class="text-[9px] text-slate-400 opacity-70"
                        >/250</span
                      >
                    </div>
                  </div>
                </div>

                <div
                  class="text-slate-300 group-hover:text-blue-500 transition text-sm"
                >
                  ›
                </div>
              </div>
            </div>
          </div>

          <template v-if="isAdmin">
            <div class="py-4 border-t border-slate-200 my-4">
              <p class="text-center text-xs font-bold text-red-500 mb-2">
                👑 Administrator Zone
              </p>
              <button
                @click="$router.push('/admin')"
                class="w-full mb-4 py-3 bg-slate-800 text-white font-bold rounded-xl shadow-lg active:scale-95 transition"
              >
                🛠️ 管理画面へ移動
              </button>
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
                <div class="space-y-2">
                  <div
                    v-for="stat in questionStats"
                    :key="'admin-' + stat.year"
                    class="text-[10px] border-b border-slate-50 last:border-0 pb-2"
                  >
                    <div class="flex justify-between font-bold mb-1">
                      <span>{{ stat.year }}</span>
                      <span
                        :class="
                          stat.total === 240 ? 'text-green-500' : 'text-red-500'
                        "
                      >
                        {{ stat.total }}/240
                      </span>
                    </div>
                    <div v-if="dbHealthReport[stat.year]">
                      <div
                        v-if="dbHealthReport[stat.year].missingAm.length > 0"
                        class="text-red-500"
                      >
                        欠番(AM):
                        {{ dbHealthReport[stat.year].missingAm.join(", ") }}
                      </div>
                      <div
                        v-if="dbHealthReport[stat.year].missingPm.length > 0"
                        class="text-red-500"
                      >
                        欠番(PM):
                        {{ dbHealthReport[stat.year].missingPm.join(", ") }}
                      </div>
                      <div
                        v-if="dbHealthReport[stat.year].duplicates.length > 0"
                        class="text-orange-500"
                      >
                        重複:
                        {{ dbHealthReport[stat.year].duplicates.join(", ") }}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </template>
        </div>

        <div
          v-else-if="currentTab === 'ranking'"
          class="animate-fade-in h-full"
        >
          <RankingView />
        </div>

        <div
          v-else-if="currentTab === 'history'"
          class="animate-fade-in space-y-8"
        >
          <MyPage />

          <div>
            <div
              class="flex items-center gap-2 mb-4 border-l-4 border-indigo-500 pl-3"
            >
              <h3 class="text-lg font-black text-slate-800">
                保存した問題 ({{ bookmarkedQuestions.length }})
              </h3>
            </div>
            <div
              v-if="bookmarkedQuestions.length === 0"
              class="text-center py-12 text-slate-400 text-xs font-bold bg-white rounded-3xl border-2 border-dashed border-slate-200"
            >
              保存された問題はまだありません
            </div>
            <div
              v-else
              class="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-1 p-1"
            >
              <div
                v-for="q in bookmarkedQuestions"
                :key="q.id"
                class="p-5 bg-white rounded-2xl shadow border border-slate-200 relative group hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer"
                @click="$router.push(`/question/${q.id}?mode=review`)"
              >
                <div
                  class="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-3"
                >
                  <span
                    class="bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200"
                    >{{ q.examYear }} {{ q.questionNumber }}</span
                  >
                  <button
                    @click.stop="toggleBookmark(q)"
                    class="text-indigo-400 hover:text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded transition"
                  >
                    保存解除
                  </button>
                </div>
                <p
                  class="text-sm font-bold text-slate-700 leading-relaxed line-clamp-2 mb-4"
                >
                  {{ q.text }}
                </p>
                <div
                  class="flex justify-end items-center border-t border-slate-50 pt-3"
                >
                  <span
                    class="text-[10px] text-indigo-600 font-bold flex items-center gap-1 group-hover:underline"
                  >
                    解説を見る
                    <span
                      class="text-xs transition-transform group-hover:translate-x-1"
                      >→</span
                    >
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentTab === 'settings'" class="animate-fade-in">
          <SettingsTab :currentUser="currentUser" />
        </div>
      </div>
    </main>

    <BaseModal ref="yearModalRef">
      <div class="p-2">
        <h3 class="text-lg font-black text-slate-800 mb-1 text-center">
          {{ selectedYearForModal }}
        </h3>
        <p class="text-xs text-slate-400 text-center mb-6">
          挑戦する時間帯を選択してください
        </p>
        <div class="space-y-3">
          <button
            @click="startYearExam('am')"
            class="w-full py-4 bg-blue-50 text-blue-600 font-bold rounded-xl border-2 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition"
          >
            ☀️ 午前問題
          </button>
          <button
            @click="startYearExam('pm')"
            class="w-full py-4 bg-orange-50 text-orange-600 font-bold rounded-xl border-2 border-orange-100 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition"
          >
            🌙 午後問題
          </button>
        </div>
        <button
          @click="yearModalRef?.close()"
          class="mt-6 w-full py-3 text-slate-400 text-xs font-bold"
        >
          キャンセル
        </button>
      </div>
    </BaseModal>

    <TheBottomNav v-model:currentTab="currentTab" class="z-40" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import { useMockExam } from "@/composables/useMockExam";
import { useNotifications } from "@/composables/useNotifications";
import TheBottomNav from "@/components/TheBottomNav/TheBottomNav.vue";
import MyPage from "@/components/MyPage/MyPage.vue";
import SettingsTab from "@/components/SettingsTab/SettingsTab.vue";
import RankingView from "@/views/RankingView/RankingView.vue";
import BaseModal from "@/uiParts/BaseModal/BaseModal.vue"; // モーダル用

const router = useRouter();
const {
  currentUser,
  masterQuestions,
  questionStats,
  dbHealthReport,
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
  cleanupDuplicates,
  studyLogs, // ログが必要なので取得
} = useNextNs();

const { activeExam, userSubmission, fetchLatestExam } = useMockExam();
const { requestNotificationPermission } = useNotifications();

const currentTab = ref("home");
const hasResumeData = ref(false);
const yearModalRef = ref<InstanceType<typeof BaseModal> | null>(null);
const selectedYearForModal = ref("");

const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];

const isAdmin = computed(() => {
  return currentUser.value && ADMIN_UIDS.includes(currentUser.value.uid);
});

const shouldNotifyMock = computed(() => {
  return activeExam.value?.status === "active" && !userSubmission.value;
});

// ★★★ 過去問ボーダー設定 (あくまで目安) ★★★
// ※ 一般の合格点は毎年変動しますが、ここでは直近の目安として設定
const EXAM_BORDERS: Record<string, { mandatory: number; general: number }> = {
  第114回: { mandatory: 40, general: 160 }, // 仮
  第113回: { mandatory: 40, general: 158 },
  第112回: { mandatory: 40, general: 152 },
  第111回: { mandatory: 40, general: 167 },
  第110回: { mandatory: 40, general: 159 },
  第109回: { mandatory: 40, general: 155 },
  第108回: { mandatory: 40, general: 155 },
  第107回: { mandatory: 40, general: 154 },
  第106回: { mandatory: 40, general: 142 },
  第105回: { mandatory: 40, general: 151 },
  第104回: { mandatory: 40, general: 150 },
};

// ★★★ 年度別スコア計算ロジック ★★★
const yearStatsList = computed(() => {
  return questionStats.value.map((stat) => {
    const year = stat.year;
    // ボーダー取得 (なければデフォルト値)
    const border = EXAM_BORDERS[year] || { mandatory: 40, general: 155 };

    // その年の問題リスト
    const yearQuestions = masterQuestions.value.filter(
      (q) => q.examYear === year
    );

    // ★修正: 「その年度のモード」で解かれたログだけを抽出
    // log.mode === 'examYear' かつ log.targetYear === year のものだけに絞る
    const answeredLogs = studyLogs.value.filter((log) => {
      // 古いデータには mode がないので、それらは除外されます（＝過去問成績には含まれない）
      // 「意図的にその年度を解こうとした」ものだけをカウント
      return (
        log.mode === "examYear" &&
        log.targetYear === year &&
        // 念のため問題IDがその年度のものかどうかもチェック（データの整合性のため）
        log.question?.examYear === year
      );
    });

    // 必修問題の正解数
    let mandatoryScore = 0;
    // 一般・状況問題の正解数
    let generalScore = 0;

    // ユニークな正解ログをカウント
    const countedIds = new Set();

    answeredLogs.forEach((log) => {
      if (countedIds.has(log.questionId)) return;

      // 直近の正解のみカウントしたい場合、studyLogsは新しい順なので
      // 最初に見つかったログが最新。
      countedIds.add(log.questionId);

      if (log.isCorrect) {
        // ログの中にquestionデータが入っている場合が多いですが、念のためマスタから判定
        const q = yearQuestions.find((q) => q.id === log.questionId);
        if (q) {
          if (q.type === "mandatory") mandatoryScore++;
          else generalScore++;
        }
      }
    });

    const answeredCount = countedIds.size;
    const isPassed =
      mandatoryScore >= border.mandatory && generalScore >= border.general;

    return {
      year,
      totalCount: stat.total,
      answeredCount,
      mandatoryScore,
      generalScore,
      totalScore: mandatoryScore + generalScore,
      border,
      isPassed,
    };
  });
});

onMounted(async () => {
  await fetchAllQuestions();
  requestNotificationPermission();

  const saved = localStorage.getItem("nextns_session_questions");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) hasResumeData.value = true;
    } catch {}
  }

  if (currentUser.value) {
    await fetchLatestExam(currentUser.value.uid);
  }
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

// モーダル制御用
const openYearModal = (year: string) => {
  selectedYearForModal.value = year;
  yearModalRef.value?.show();
};

const startYearExam = (period: "am" | "pm") => {
  yearModalRef.value?.close();
  startStudy({
    mode: "examYear",
    year: selectedYearForModal.value,
    period: period,
  });
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
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

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
