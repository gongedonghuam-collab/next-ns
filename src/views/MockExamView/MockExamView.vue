<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import { useMockExam } from "@/composables/useMockExam";

const router = useRouter();
const { currentUser } = useNextNs();
const {
  loading,
  activeExam,
  examList, // ★追加: 全リスト
  userSubmission,
  examQuestions,
  fetchAllExams, // ★追加: 全取得
  fetchUserSubmission, // ★追加: 個別の結果取得
  loadExamQuestions,
  submitExam,
} = useMockExam();

// --- 画面管理 ---
const viewMode = ref<"list" | "detail">("list");
const isTakingExam = ref(false);
const userAnswers = ref<number[]>([]);
const activeResultTab = ref<"wrong" | "correct">("wrong");

// --- ★修正: 模試リストの振り分け ---
// 1. リストの先頭を「最新」とする
const latestExam = computed(() => {
  return examList.value.length > 0 ? examList.value[0] : null;
});

// 2. 2番目以降を「履歴」とする
const historyExams = computed(() => {
  return examList.value.length > 1 ? examList.value.slice(1) : [];
});

// --- 初期化 ---
onMounted(async () => {
  if (currentUser.value) {
    // 1. 全ての模試を取得
    await fetchAllExams();

    // 2. 最新の模試があれば、とりあえず activeExam にセットしておく（初期表示用）
    if (latestExam.value) {
      activeExam.value = latestExam.value;
      // 最新の回答状況を確認しておく
      await fetchUserSubmission(latestExam.value.id, currentUser.value.uid);
    }

    viewMode.value = "list";
  }
});

// --- アクション ---

// ★修正: 模試を選択して詳細へ移動
const selectExam = async (examData: any) => {
  if (!currentUser.value) return;

  // 1. 選択した模試をアクティブにする
  activeExam.value = examData;

  // 2. その模試の回答データを取得しにいく
  // (これをしないと、過去の模試を開いても最新の結果が表示されたり、結果がない扱いになったりします)
  await fetchUserSubmission(examData.id, currentUser.value.uid);

  // 3. 提出済みなら、振り返り用に問題データもロードする
  if (userSubmission.value) {
    await loadExamQuestions();
  }

  viewMode.value = "detail";
  window.scrollTo(0, 0);
};

const backToList = () => {
  viewMode.value = "list";
  activeResultTab.value = "wrong";
  window.scrollTo(0, 0);
};

const backToHome = () => {
  router.push("/");
};

const startExam = async () => {
  await loadExamQuestions();
  userAnswers.value = new Array(examQuestions.value.length).fill(-1);
  isTakingExam.value = true;
  window.scrollTo(0, 0);
};

const handleSubmit = async () => {
  const unansweredCount = userAnswers.value.filter((a) => a === -1).length;
  if (unansweredCount > 0) {
    if (!confirm(`未回答が ${unansweredCount} 問あります。\n提出しますか？`))
      return;
  } else {
    if (!confirm("提出しますか？\n提出後の修正はできません。")) return;
  }

  if (currentUser.value) {
    await submitExam(
      currentUser.value.uid,
      userAnswers.value,
      examQuestions.value
    );
    isTakingExam.value = false;
    window.scrollTo(0, 0);
  }
};

// --- Computed (既存ロジック) ---
const judgeResult = computed(() => {
  const stats = activeExam.value?.stats;
  const sub = userSubmission.value;
  if (!stats || !sub) return null;
  const isMandatoryOk = sub.mandatoryScore >= stats.mandatoryBorder;
  const isGeneralOk = sub.generalScore >= stats.generalBorder;
  return isMandatoryOk && isGeneralOk ? "合格" : "不合格";
});

const failReason = computed(() => {
  if (judgeResult.value === "合格") return null;
  const stats = activeExam.value?.stats;
  const sub = userSubmission.value;
  if (!stats || !sub) return "";
  const reasons = [];
  if (sub.mandatoryScore < stats.mandatoryBorder) reasons.push("必修落ち");
  if (sub.generalScore < stats.generalBorder) reasons.push("一般得点不足");
  return reasons.join("・");
});

const deadlineString = computed(() => {
  if (!activeExam.value?.deadline) return "";
  // Date型変換済みで渡ってくる想定ですが、念のためチェック
  const date = activeExam.value.deadline.toDate
    ? activeExam.value.deadline.toDate()
    : new Date(activeExam.value.deadline);
  return date.toLocaleDateString() + " まで";
});

const wrongQuestions = computed(() => {
  if (!examQuestions.value || !userSubmission.value) return [];
  const answers = userSubmission.value.userAnswers || [];
  return examQuestions.value.filter((q, index) => {
    const userChoice = answers[index];
    return (
      userChoice === undefined ||
      userChoice === -1 ||
      !q.correctIndices.includes(userChoice)
    );
  });
});

const correctQuestions = computed(() => {
  if (!examQuestions.value || !userSubmission.value) return [];
  const answers = userSubmission.value.userAnswers || [];
  return examQuestions.value.filter((q, index) => {
    const userChoice = answers[index];
    return (
      userChoice !== undefined &&
      userChoice !== -1 &&
      q.correctIndices.includes(userChoice)
    );
  });
});

const displayList = computed(() => {
  return activeResultTab.value === "wrong"
    ? wrongQuestions.value
    : correctQuestions.value;
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-32">
    <header
      class="bg-white px-6 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-30"
    >
      <button
        v-if="viewMode === 'detail'"
        @click="backToList"
        class="text-slate-400 font-bold text-sm hover:text-slate-600 transition"
      >
        ← 一覧へ
      </button>
      <button
        v-else
        @click="backToHome"
        class="text-slate-400 font-bold text-sm hover:text-slate-600 transition"
      >
        ← HOME
      </button>
      <h1 class="text-lg font-black text-slate-800">📊 全国統一模試</h1>
    </header>

    <main class="max-w-md mx-auto px-6 pt-8">
      <div
        v-if="loading && examList.length === 0"
        class="text-center py-20 text-slate-400 font-bold animate-pulse"
      >
        通信中...
      </div>

      <div v-else-if="viewMode === 'list'" class="space-y-8 animate-fade-in">
        <section v-if="latestExam">
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">🔥</span>
            <h2 class="font-black text-slate-700">開催中の最新模試</h2>
          </div>

          <div
            @click="selectExam(latestExam)"
            class="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 text-center relative overflow-hidden cursor-pointer active:scale-[0.98] transition group"
          >
            <div class="relative z-10">
              <span
                class="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              >
                Latest
              </span>
              <h2 class="text-2xl font-black mt-4 mb-2 group-hover:underline">
                {{ latestExam.title }}
              </h2>
              <p class="text-sm font-bold text-blue-100 mb-4">
                締切:
                {{ new Date(latestExam.deadline).toLocaleDateString() }} まで
              </p>

              <div
                v-if="userSubmission && activeExam?.id === latestExam.id"
                class="bg-white/20 backdrop-blur-sm rounded-xl py-2 px-4 inline-block"
              >
                <span class="text-xs font-bold">提出済み - 結果を見る →</span>
              </div>
              <div
                v-else
                class="bg-white text-blue-600 rounded-xl py-3 px-6 font-bold shadow-lg inline-block"
              >
                詳細を見る →
              </div>
            </div>
            <div class="absolute -bottom-10 -right-10 text-9xl opacity-20">
              📝
            </div>
          </div>
        </section>

        <section v-else class="text-center py-8">
          <p class="text-slate-400 font-bold">現在開催中の模試はありません</p>
        </section>

        <hr class="border-slate-200" />

        <section>
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xl">📂</span>
            <h2 class="font-black text-slate-700">受験履歴</h2>
          </div>

          <div
            v-if="historyExams.length === 0"
            class="text-center py-8 bg-white rounded-3xl border border-dashed border-slate-300"
          >
            <p class="text-slate-400 text-xs font-bold">
              過去の履歴はありません
            </p>
          </div>

          <div class="space-y-3">
            <div
              v-for="hist in historyExams"
              :key="hist.id"
              @click="selectExam(hist)"
              class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition active:scale-[0.98]"
            >
              <div>
                <div class="text-[10px] font-bold text-slate-400 mb-1">
                  {{
                    new Date(
                      hist.createdAt?.seconds * 1000
                    ).toLocaleDateString()
                  }}
                  公開
                </div>
                <h3 class="font-bold text-slate-700">{{ hist.title }}</h3>
              </div>
              <div class="text-slate-300">›</div>
            </div>
          </div>
        </section>
      </div>

      <div
        v-else-if="viewMode === 'detail' && activeExam"
        class="animate-fade-in"
      >
        <div v-if="isTakingExam" class="space-y-8">
          <div
            class="bg-blue-600 text-white p-4 rounded-xl shadow-lg sticky top-20 z-20 flex justify-between items-center"
          >
            <span class="font-bold text-sm">残り問題数</span>
            <span class="text-xl font-black"
              >{{ userAnswers.filter((a) => a === -1).length }} /
              {{ examQuestions.length }}問</span
            >
          </div>

          <div
            v-for="(q, idx) in examQuestions"
            :key="q.id"
            class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div class="flex justify-between mb-4">
              <span
                class="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded"
                >第{{ idx + 1 }}問</span
              >
              <span
                class="text-[10px] font-bold px-2 py-1 rounded"
                :class="
                  q.type === 'mandatory'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-blue-50 text-blue-600'
                "
              >
                {{ q.type === "mandatory" ? "必修" : "一般" }}
              </span>
            </div>
            <h3 class="font-bold text-slate-800 mb-6 leading-relaxed">
              {{ q.text }}
            </h3>
            <div class="space-y-3">
              <button
                v-for="(choice, cIdx) in q.choices"
                :key="cIdx"
                @click="userAnswers[idx] = cIdx"
                class="w-full text-left p-4 rounded-xl border-2 transition font-bold text-sm"
                :class="
                  userAnswers[idx] === cIdx
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                "
              >
                <span class="mr-2 opacity-50">{{ cIdx + 1 }}.</span>
                {{ choice }}
              </button>
            </div>
          </div>

          <button
            @click="handleSubmit"
            class="w-full py-5 bg-green-600 text-white font-black rounded-3xl shadow-xl active:scale-95 transition"
          >
            回答を提出する
          </button>
        </div>

        <div
          v-else-if="
            activeExam.status === 'released' &&
            userSubmission &&
            activeExam.stats
          "
          class="space-y-6"
        >
          <div
            class="bg-white rounded-[40px] p-8 shadow-xl text-center border-4 relative overflow-hidden"
            :class="
              judgeResult === '合格' ? 'border-red-500' : 'border-blue-500'
            "
          >
            <div
              v-if="judgeResult === '合格'"
              class="absolute -right-10 -top-10 text-9xl opacity-10"
            >
              🌸
            </div>
            <p
              class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2"
            >
              JUDGMENT
            </p>
            <h2
              class="text-6xl font-black mb-2"
              :class="judgeResult === '合格' ? 'text-red-500' : 'text-blue-500'"
            >
              {{ judgeResult }}
            </h2>
            <p
              v-if="judgeResult === '不合格'"
              class="text-xs font-bold text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-full mb-4"
            >
              原因: {{ failReason }}
            </p>

            <div class="space-y-3 mt-4">
              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-red-500">必修問題</span>
                  <span class="text-[10px] text-slate-400"
                    >ボーダー: {{ activeExam.stats.mandatoryBorder }}点</span
                  >
                </div>
                <div class="flex items-end gap-1">
                  <span
                    class="text-2xl font-black text-slate-800"
                    :class="{
                      'text-red-500':
                        userSubmission.mandatoryScore <
                        activeExam.stats.mandatoryBorder,
                    }"
                  >
                    {{ userSubmission.mandatoryScore }}
                  </span>
                  <span class="text-xs font-bold text-slate-400 mb-1"
                    >/ {{ activeExam.stats.mandatoryMax }}点</span
                  >
                  <span
                    class="ml-auto text-xs font-bold px-2 py-0.5 rounded"
                    :class="
                      userSubmission.mandatoryScore >=
                      activeExam.stats.mandatoryBorder
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    "
                  >
                    {{
                      userSubmission.mandatoryScore >=
                      activeExam.stats.mandatoryBorder
                        ? "クリア"
                        : "不可"
                    }}
                  </span>
                </div>
              </div>

              <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-blue-500"
                    >一般・状況</span
                  >
                  <span class="text-[10px] text-slate-400"
                    >ボーダー: {{ activeExam.stats.generalBorder }}点</span
                  >
                </div>
                <div class="flex items-end gap-1">
                  <span
                    class="text-2xl font-black text-slate-800"
                    :class="{
                      'text-blue-500':
                        userSubmission.generalScore <
                        activeExam.stats.generalBorder,
                    }"
                  >
                    {{ userSubmission.generalScore }}
                  </span>
                  <span class="text-xs font-bold text-slate-400 mb-1"
                    >/ {{ activeExam.stats.generalMax }}点</span
                  >
                  <span
                    class="ml-auto text-xs font-bold px-2 py-0.5 rounded"
                    :class="
                      userSubmission.generalScore >=
                      activeExam.stats.generalBorder
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    "
                  >
                    {{
                      userSubmission.generalScore >=
                      activeExam.stats.generalBorder
                        ? "クリア"
                        : "不可"
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div class="mt-4 text-[10px] font-bold text-slate-400">
              受験者数: {{ activeExam.stats.totalParticipants }}人 |
              平均点(一般): {{ activeExam.stats.generalAverage }}点
            </div>
          </div>

          <div
            class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div class="flex border-b border-slate-100">
              <button
                @click="activeResultTab = 'wrong'"
                class="flex-1 py-4 text-xs font-bold transition-colors relative"
                :class="
                  activeResultTab === 'wrong'
                    ? 'text-red-500 bg-red-50'
                    : 'text-slate-400 hover:bg-slate-50'
                "
              >
                ⚠️ 間違えた問題
                <span
                  class="ml-1 bg-white border border-slate-200 px-1.5 rounded-full text-[10px] text-slate-500"
                >
                  {{ wrongQuestions.length }}
                </span>
                <div
                  v-if="activeResultTab === 'wrong'"
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-red-500"
                ></div>
              </button>

              <button
                @click="activeResultTab = 'correct'"
                class="flex-1 py-4 text-xs font-bold transition-colors relative"
                :class="
                  activeResultTab === 'correct'
                    ? 'text-green-600 bg-green-50'
                    : 'text-slate-400 hover:bg-slate-50'
                "
              >
                ⭕️ 正解した問題
                <span
                  class="ml-1 bg-white border border-slate-200 px-1.5 rounded-full text-[10px] text-slate-500"
                >
                  {{ correctQuestions.length }}
                </span>
                <div
                  v-if="activeResultTab === 'correct'"
                  class="absolute bottom-0 left-0 w-full h-0.5 bg-green-500"
                ></div>
              </button>
            </div>

            <div class="p-2 min-h-[200px]">
              <div
                v-if="displayList.length === 0"
                class="text-center py-10 text-slate-400 text-xs font-bold"
              >
                {{
                  activeResultTab === "wrong"
                    ? "🎉 間違えた問題はありません！完璧です！"
                    : "まだ正解がありません...復習しましょう！"
                }}
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="q in displayList"
                  :key="q.id"
                  @click="router.push(`/question/${q.id}?mode=review`)"
                  class="p-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition cursor-pointer flex gap-3 group border border-transparent hover:border-slate-100"
                >
                  <div class="flex-shrink-0 mt-1">
                    <span
                      v-if="activeResultTab === 'wrong'"
                      class="text-[10px] font-black bg-red-100 text-red-600 px-2 py-1 rounded"
                    >
                      MISS
                    </span>
                    <span
                      v-else
                      class="text-[10px] font-black bg-green-100 text-green-600 px-2 py-1 rounded"
                    >
                      GOOD
                    </span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 opacity-60">
                      <span
                        class="text-[9px] font-bold border border-slate-200 px-1 rounded"
                      >
                        {{ q.examYear }}
                      </span>
                      <span
                        class="text-[9px] font-bold border border-slate-200 px-1 rounded"
                      >
                        No.{{ q.questionNumber }}
                      </span>
                    </div>
                    <p
                      class="text-xs font-bold text-slate-700 line-clamp-2 leading-relaxed"
                    >
                      {{ q.text }}
                    </p>
                  </div>

                  <div
                    class="flex items-center text-slate-300 text-lg group-hover:text-blue-500 transition"
                  >
                    ›
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="userSubmission"
          class="text-center py-16 bg-white rounded-3xl shadow-sm border border-slate-100"
        >
          <div class="text-6xl mb-6">📮</div>
          <h2 class="text-xl font-black text-slate-800 mb-2">提出済みです</h2>
          <p class="text-sm text-slate-500 mb-6 leading-relaxed">
            現在、集計期間中です。<br />
            結果発表までしばらくお待ちください。
          </p>
        </div>

        <div v-else class="space-y-6">
          <div
            class="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 text-center relative overflow-hidden"
          >
            <div class="relative z-10">
              <span
                class="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                >Exam</span
              >
              <h2 class="text-2xl font-black mt-4 mb-2">
                {{ activeExam.title }}
              </h2>
              <p class="text-sm font-bold text-blue-100">
                締切: {{ deadlineString }}
              </p>
            </div>
            <div class="absolute -bottom-10 -right-10 text-9xl opacity-20">
              📝
            </div>
          </div>

          <button
            @click="startExam"
            class="w-full py-5 bg-slate-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition flex items-center justify-center gap-2"
          >
            <span>模試を開始する</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
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
