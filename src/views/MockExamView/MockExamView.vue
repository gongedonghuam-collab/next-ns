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
  userSubmission,
  examQuestions,
  fetchLatestExam,
  loadExamQuestions,
  submitExam,
} = useMockExam();

// ユーザーの回答（インデックス）を保持する配列
const userAnswers = ref<number[]>([]);
// 画面状態（0:トップ, 1:試験中）
const isTakingExam = ref(false);

onMounted(async () => {
  if (currentUser.value) {
    await fetchLatestExam(currentUser.value.uid);
  }
});

// 試験開始
const startExam = async () => {
  await loadExamQuestions();
  // 回答配列を初期化 (-1は未回答)
  userAnswers.value = new Array(examQuestions.value.length).fill(-1);
  isTakingExam.value = true;
  window.scrollTo(0, 0);
};

// 提出処理
const handleSubmit = async () => {
  // 未回答チェック
  const unansweredCount = userAnswers.value.filter((a) => a === -1).length;
  if (unansweredCount > 0) {
    if (
      !confirm(
        `未回答が ${unansweredCount} 問あります。\nこのまま提出しますか？`
      )
    )
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
    // 状態をリセットして結果画面（待機画面）へ
    isTakingExam.value = false;
    window.scrollTo(0, 0);
  }
};

// 合否判定
const judgeResult = computed(() => {
  if (!activeExam.value?.stats || !userSubmission.value) return null;
  return userSubmission.value.score >= activeExam.value.stats.borderScore
    ? "合格"
    : "不合格";
});

// 締め切りフォーマット
const deadlineString = computed(() => {
  if (!activeExam.value?.deadline) return "";
  return activeExam.value.deadline.toLocaleDateString() + " まで";
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 font-sans pb-32">
    <header
      class="bg-white px-6 py-4 shadow-sm flex items-center gap-4 sticky top-0 z-30"
    >
      <button
        @click="router.push('/')"
        class="text-slate-400 font-bold text-sm"
      >
        ← HOME
      </button>
      <h1 class="text-lg font-black text-slate-800">📊 全国統一模試</h1>
    </header>

    <main class="max-w-md mx-auto px-6 pt-8">
      <div
        v-if="loading"
        class="text-center py-20 text-slate-400 font-bold animate-pulse"
      >
        通信中...
      </div>

      <div
        v-else-if="!activeExam"
        class="text-center py-12 bg-white rounded-3xl shadow-sm border border-slate-100"
      >
        <p class="text-4xl mb-4">💤</p>
        <p class="font-bold text-slate-600">現在開催中の模試はありません</p>
        <p class="text-xs text-slate-400 mt-2">
          次回のお知らせをお待ちください
        </p>
      </div>

      <div v-else-if="isTakingExam" class="space-y-8">
        <div
          class="bg-blue-600 text-white p-4 rounded-xl shadow-lg sticky top-20 z-20"
        >
          <div class="flex justify-between items-center">
            <span class="font-bold">残り問題数</span>
            <span class="text-xl font-black"
              >{{ userAnswers.filter((a) => a === -1).length }}問</span
            >
          </div>
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
            <span class="text-xs font-bold text-slate-400">{{
              q.examYear
            }}</span>
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
        v-else-if="activeExam.status === 'released' && userSubmission"
        class="animate-fade-in space-y-6"
      >
        <div
          class="bg-white rounded-[40px] p-8 shadow-xl text-center border-4 relative overflow-hidden"
          :class="judgeResult === '合格' ? 'border-red-500' : 'border-blue-500'"
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
            RESULT
          </p>
          <h2
            class="text-6xl font-black mb-6"
            :class="judgeResult === '合格' ? 'text-red-500' : 'text-blue-500'"
          >
            {{ judgeResult }}
          </h2>

          <div class="grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4">
            <div>
              <p class="text-[10px] text-slate-400 font-bold mb-1">
                あなたの点数
              </p>
              <p class="text-2xl font-black text-slate-800">
                {{ userSubmission.score }}<span class="text-sm ml-1">点</span>
              </p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 font-bold mb-1">
                受験者平均
              </p>
              <p class="text-2xl font-black text-slate-600">
                {{ activeExam.stats?.average
                }}<span class="text-sm ml-1">点</span>
              </p>
            </div>
          </div>

          <div class="mt-4 text-xs font-bold text-slate-500">
            合格ボーダー: {{ activeExam.stats?.borderScore }}点以上 /
            {{ activeExam.stats?.totalParticipants }}人中
          </div>
        </div>

        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 class="font-bold text-slate-700 mb-2">💡 学習アドバイス</h3>
          <p
            class="text-sm text-slate-600 leading-relaxed"
            v-if="judgeResult === '合格'"
          >
            おめでとうございます！基礎知識はバッチリです。この調子で過去問演習を続け、応用力を磨きましょう。
          </p>
          <p class="text-sm text-slate-600 leading-relaxed" v-else>
            今回は残念な結果でしたが、弱点を知る良い機会です。平均点との差を埋めるため、間違えた分野（基礎看護など）を重点的に復習しましょう。
          </p>
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
        <div class="inline-block bg-slate-100 px-6 py-3 rounded-xl">
          <p class="text-xs font-bold text-slate-400 mb-1">自己採点（素点）</p>
          <p class="text-2xl font-black text-slate-700">
            {{ userSubmission.score }} / 30点
          </p>
        </div>
      </div>

      <div v-else class="space-y-6">
        <div
          class="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-[32px] p-8 text-white shadow-xl shadow-blue-200 text-center relative overflow-hidden"
        >
          <div class="relative z-10">
            <span
              class="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest"
              >New Exam</span
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

        <div
          class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl"
            >
              ⏰
            </div>
            <div>
              <p class="font-bold text-slate-700">制限時間なし</p>
              <p class="text-xs text-slate-400">自分のペースで解けます</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl"
            >
              🔢
            </div>
            <div>
              <p class="font-bold text-slate-700">全30問</p>
              <p class="text-xs text-slate-400">ランダムに出題されます</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl"
            >
              📊
            </div>
            <div>
              <p class="font-bold text-slate-700">偏差値・合否判定</p>
              <p class="text-xs text-slate-400">締切後に結果を一斉公開</p>
            </div>
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
