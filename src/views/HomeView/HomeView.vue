<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue";
import { useNextNs } from "@/composables/useNextNs";
import QuizCard from "@/components/QuizCard/QuizCard.vue";
import TheBottomNav from "@/components/TheBottomNav/TheBottomNav.vue";
import SettingsTab from "@/components/SettingsTab/SettingsTab.vue";
import MyPage from "@/components/MyPage/MyPage.vue";
import JsonUploader from "@/components/JsonUploader.vue";
import type { Question } from "@/types";

const {
  questions,
  reviewQuestions,
  bookmarkedQuestions,
  loading,
  fetchQuestions,
  fetchReviewQuestions,
  fetchBookmarks,
  currentUser,
  logout,
  saveAnswer,
  todayLogCount,
  availableTags,
  currentLevel,
  selectedPeriod,
  clearSession,
  currentSessionIndex,
} = useNextNs();

const currentTab = ref("home");
const studyMode = ref<"daily" | "review" | "bookmark">("daily");
const selectedTag = ref<string | null>(null);

// ★追加: 復習モード用の絞り込みフィルター
const reviewFilter = ref<"all" | "incorrect" | "ng" | "so-so">("all");

onMounted(() => {
  fetchQuestions();
});

watch(studyMode, (newMode) => {
  if (newMode === "daily") fetchQuestions();
  if (newMode === "review") fetchReviewQuestions();
  if (newMode === "bookmark") fetchBookmarks();
  selectedTag.value = null;
  reviewFilter.value = "all"; // モード変更時にフィルターリセット
});

const onAnswer = async (
  question: Question,
  isCorrect: boolean,
  choiceIndex: number,
  confidence: "ok" | "so-so" | "ng"
) => {
  await saveAnswer(question, choiceIndex, isCorrect, confidence);
};

const handleReset = () => {
  if (confirm("現在の進行状況をリセットして、新しい問題をロードしますか？")) {
    clearSession();
    fetchQuestions(true);
  }
};

const dailyGoal = 10;
const progressPercent = computed(() =>
  Math.min((todayLogCount.value / dailyGoal) * 100, 100)
);

const displayQuestions = computed(() => {
  let list: Question[] = [];

  if (studyMode.value === "daily") {
    list = questions.value;
  } else if (studyMode.value === "review") {
    list = reviewQuestions.value;

    // ★復習モードの絞り込みロジック
    if (reviewFilter.value === "incorrect") {
      // 不正解だったもの
      list = list.filter((q) => q.lastResult && !q.lastResult.isCorrect);
    } else if (reviewFilter.value === "ng") {
      // 自信なし(❌)としたもの
      list = list.filter((q) => q.lastResult?.confidence === "ng");
    } else if (reviewFilter.value === "so-so") {
      // あやふや(🔺)としたもの
      list = list.filter((q) => q.lastResult?.confidence === "so-so");
    }
  } else if (studyMode.value === "bookmark") {
    list = bookmarkedQuestions.value;
  }

  // タグフィルター（全モード共通）
  if (selectedTag.value) {
    list = list.filter((q) => q.tags.includes(selectedTag.value!));
  }

  return list;
});

const modeTitle = computed(() => {
  if (studyMode.value === "daily") return "演習";
  if (studyMode.value === "review") return "復習";
  return "保存";
});
</script>

<template>
  <div class="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
    <header
      class="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 h-16"
    >
      <div
        class="max-w-lg mx-auto px-5 h-full flex justify-between items-center"
      >
        <h1
          class="font-black text-xl tracking-tight text-slate-800 flex items-center gap-1"
        >
          <span class="text-blue-600 text-2xl">⚡️</span> NextNs
        </h1>
        <div class="flex items-center gap-3">
          <div
            class="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black border border-indigo-200"
          >
            Lv.{{ currentLevel }}
          </div>
          <button
            @click="logout"
            class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition"
          >
            🚪
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-5 pt-24">
      <div v-if="currentTab === 'home'">
        <div class="flex bg-slate-100 p-1 rounded-xl mb-4 gap-1">
          <button
            @click="studyMode = 'daily'"
            class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap"
            :class="
              studyMode === 'daily'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            "
          >
            🔥 演習
          </button>
          <button
            @click="studyMode = 'review'"
            class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap"
            :class="
              studyMode === 'review'
                ? 'bg-white text-orange-500 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            "
          >
            💪 復習
          </button>
          <button
            @click="studyMode = 'bookmark'"
            class="flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-200 whitespace-nowrap"
            :class="
              studyMode === 'bookmark'
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            "
          >
            ★ 保存
          </button>
        </div>

        <div
          v-if="studyMode === 'daily'"
          class="flex justify-between items-center mb-4"
        >
          <div class="flex gap-2">
            <button
              @click="selectedPeriod = 'all'"
              class="px-3 py-1 rounded-full text-xs font-bold border transition"
              :class="
                selectedPeriod === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500'
              "
            >
              すべて
            </button>
            <button
              @click="selectedPeriod = 'am'"
              class="px-3 py-1 rounded-full text-xs font-bold border transition"
              :class="
                selectedPeriod === 'am'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500'
              "
            >
              午前
            </button>
            <button
              @click="selectedPeriod = 'pm'"
              class="px-3 py-1 rounded-full text-xs font-bold border transition"
              :class="
                selectedPeriod === 'pm'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-500'
              "
            >
              午後
            </button>
          </div>
          <button
            @click="handleReset"
            class="text-[10px] text-red-400 underline"
          >
            進行リセット
          </button>
        </div>

        <div v-if="studyMode === 'review'" class="mb-4">
          <div class="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              @click="reviewFilter = 'all'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap"
              :class="
                reviewFilter === 'all'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-slate-500'
              "
            >
              すべて
            </button>
            <button
              @click="reviewFilter = 'incorrect'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap"
              :class="
                reviewFilter === 'incorrect'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-slate-500'
              "
            >
              不正解のみ
            </button>
            <button
              @click="reviewFilter = 'ng'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap"
              :class="
                reviewFilter === 'ng'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-white text-slate-500'
              "
            >
              ❌ 自信なし
            </button>
            <button
              @click="reviewFilter = 'so-so'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold border transition whitespace-nowrap"
              :class="
                reviewFilter === 'so-so'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-slate-500'
              "
            >
              🔺 あやふや
            </button>
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-4 no-scrollbar mb-2">
          <button
            @click="selectedTag = null"
            class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all"
            :class="
              selectedTag === null
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-500 border-slate-200'
            "
          >
            すべて
          </button>
          <button
            v-for="tag in availableTags"
            :key="tag"
            @click="selectedTag = tag"
            class="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold border transition-all"
            :class="
              selectedTag === tag
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-slate-500 border-slate-200'
            "
          >
            #{{ tag }}
          </button>
        </div>

        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-20"
        >
          <div
            class="animate-spin w-10 h-10 border-4 border-t-transparent rounded-full mb-4"
            :class="
              studyMode === 'review' ? 'border-orange-500' : 'border-blue-600'
            "
          ></div>
          <p class="text-xs font-bold text-slate-400 animate-pulse">
            読み込み中...
          </p>
        </div>

        <div v-else>
          <div
            v-if="studyMode === 'daily'"
            class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6"
          >
            <div
              class="flex justify-between text-xs font-bold text-slate-500 mb-2"
            >
              <span>今日の目標</span>
              <span>{{ todayLogCount }} / {{ dailyGoal }}問</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                class="bg-blue-500 h-full rounded-full transition-all duration-500"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>
          </div>

          <div class="flex justify-between items-end mb-6 px-1">
            <h2 class="font-bold text-xl text-slate-800">
              <span v-if="selectedTag" class="text-blue-500 mr-2"
                >#{{ selectedTag }}</span
              >
              <span v-else>{{ modeTitle }}</span>
            </h2>
            <span
              class="text-xs font-bold px-3 py-1 rounded-full border shadow-sm bg-white text-slate-500"
            >
              残り {{ displayQuestions.length }}問
            </span>
          </div>

          <div v-if="displayQuestions.length > 0">
            <template v-if="studyMode === 'daily'">
              <QuizCard
                v-if="displayQuestions[0]"
                :key="displayQuestions[0].id"
                :question="displayQuestions[0]"
                :index="currentSessionIndex"
                @answer="
                  (isCorrect, idx, confidence) =>
                    onAnswer(displayQuestions[0], isCorrect, idx, confidence)
                "
              />
            </template>
            <template v-else>
              <QuizCard
                v-for="(q, index) in displayQuestions"
                :key="q.id"
                :question="q"
                :index="index"
                @answer="
                  (isCorrect, idx, confidence) =>
                    onAnswer(q, isCorrect, idx, confidence)
                "
              />
            </template>
          </div>

          <div v-else class="text-center py-20 text-slate-400">
            <template v-if="studyMode === 'review'">
              <p class="text-4xl mb-4">🎉</p>
              <p class="font-bold">素晴らしい！</p>
              <p class="text-xs mt-2">
                復習が必要な問題はありません<br />（または条件に合う問題がありません）
              </p>
            </template>
            <template v-else-if="studyMode === 'daily'">
              <p class="text-4xl mb-4">🎉</p>
              <p class="font-bold">問題はありません</p>
              <p class="text-xs mt-2">
                すべての問題を解き終えました！<br />リセットして再挑戦できます。
              </p>
            </template>
            <template v-else>
              <p class="text-4xl mb-4">📭</p>
              <p class="font-bold">問題が見つかりません</p>
            </template>
          </div>
        </div>

        <JsonUploader />
      </div>

      <div v-else-if="currentTab === 'history'">
        <MyPage />
      </div>

      <div v-else-if="currentTab === 'settings'">
        <SettingsTab :currentUser="currentUser" />
      </div>
    </main>

    <TheBottomNav
      :currentTab="currentTab"
      @update:currentTab="currentTab = $event"
    />
  </div>
</template>

<style>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
