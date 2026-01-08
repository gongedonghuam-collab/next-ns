<template>
  <div class="min-h-screen bg-slate-100 font-sans pb-20">
    <header
      class="bg-slate-800 text-white px-6 py-4 shadow-md sticky top-0 z-50"
    >
      <div class="max-w-4xl mx-auto flex justify-between items-center">
        <h1 class="font-bold text-lg flex items-center gap-2">
          🛠️ 管理者ダッシュボード
        </h1>
        <button
          @click="router.push('/')"
          class="text-xs bg-slate-700 px-3 py-2 rounded hover:bg-slate-600 transition"
        >
          アプリに戻る
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto px-4 mt-8 space-y-8">
      <section
        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden"
      >
        <div class="absolute top-0 right-0 p-4 opacity-10 text-6xl">📊</div>
        <h2
          class="font-bold text-slate-700 mb-6 flex items-center gap-2 relative z-10"
        >
          <span class="bg-indigo-100 text-indigo-600 p-1 rounded">👑</span>
          一斉模試センター
        </h2>

        <div
          v-if="activeExam"
          class="bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-6 relative"
        >
          <button
            @click="deleteMockExam(activeExam.id)"
            class="absolute top-4 right-4 text-xs text-red-500 font-bold hover:underline bg-white px-2 py-1 rounded shadow-sm"
          >
            🗑️ 削除
          </button>

          <div class="flex justify-between items-start mb-2 pr-16">
            <h3 class="font-black text-indigo-800 text-lg">
              {{ activeExam.title }}
            </h3>
            <span
              class="text-xs font-bold px-2 py-1 rounded bg-white text-indigo-600 border border-indigo-100 whitespace-nowrap"
            >
              {{ activeExam.status === "active" ? "開催中" : "公開済み" }}
            </span>
          </div>
          <p class="text-xs text-indigo-500 mb-4">
            締切: {{ new Date(activeExam.deadline).toLocaleDateString() }}
          </p>

          <div v-if="activeExam.status === 'active'">
            <div
              class="bg-white p-4 rounded-xl border border-indigo-100 mb-4 text-center shadow-sm"
            >
              <p class="text-xs font-bold text-slate-400 mb-1">
                現在の回答者数
              </p>
              <div class="flex items-baseline justify-center gap-1">
                <span class="text-3xl font-black text-indigo-600">{{
                  currentAnswerCount
                }}</span>
                <span class="text-sm font-bold text-slate-500">人</span>
              </div>
            </div>

            <button
              @click="closeAndReleaseExam(activeExam.id)"
              :disabled="loading"
              class="w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow hover:bg-red-600 transition active:scale-95"
            >
              🚨 締め切って集計・結果公開する
            </button>
            <p class="text-[10px] text-center text-slate-400 mt-2">
              ※ これを押すとユーザーに合否が表示されます
            </p>
          </div>
          <div v-else>
            <div
              class="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-lg"
            >
              <div>
                <p class="text-[9px] text-slate-400">受験者</p>
                <p class="font-bold">
                  {{ activeExam.stats?.totalParticipants }}人
                </p>
              </div>
              <div>
                <p class="text-[9px] text-slate-400">平均(一般)</p>
                <p class="font-bold">
                  {{ activeExam.stats?.generalAverage }}点
                </p>
              </div>
              <div>
                <p class="text-[9px] text-slate-400">合格点(一般)</p>
                <p class="font-bold text-red-500">
                  {{ activeExam.stats?.generalBorder }}点
                </p>
              </div>
            </div>
            <div class="mt-2 text-center text-[10px] text-slate-400">
              必修合格点: {{ activeExam.stats?.mandatoryBorder }}点 /
              {{ activeExam.stats?.mandatoryMax }}点
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-6">
          <h3 class="text-sm font-bold text-slate-600 mb-3">新規模試の作成</h3>
          <div class="flex gap-2">
            <input
              v-model="newMockTitle"
              placeholder="タイトル (例: 第3回 全国模試)"
              class="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-indigo-500"
            />
            <button
              @click="handleCreateMock"
              class="bg-indigo-600 text-white font-bold px-4 rounded-lg text-sm hover:bg-indigo-700 transition"
            >
              作成
            </button>
          </div>
          <p class="text-[10px] text-slate-400 mt-2">
            ※
            データベース内の全問題からランダムに30問選出され、3日後が締切になります。
          </p>
        </div>
      </section>

      <section
        class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
      >
        <h2 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span class="bg-green-100 text-green-600 p-1 rounded">＋</span>
          新規問題追加
        </h2>

        <form @submit.prevent="handleSubmitNew" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1"
                >年度 (例: 第106回)</label
              >
              <input
                v-model="newQ.examYear"
                required
                class="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none"
                placeholder="第〇〇回"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1"
                >番号 (例: 午前1)</label
              >
              <input
                v-model="newQ.questionNumber"
                required
                class="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none"
                placeholder="午前〇〇"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1"
              >問題文</label
            >
            <textarea
              v-model="newQ.text"
              required
              rows="3"
              class="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none"
              placeholder="問題文を入力..."
            ></textarea>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-500"
              >選択肢 (正解にチェックを入れる)</label
            >
            <div
              v-for="(choice, i) in newQ.choices"
              :key="i"
              class="flex items-center gap-2"
            >
              <input
                type="checkbox"
                :value="i"
                v-model="newQ.correctIndices"
                class="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <input
                v-model="newQ.choices[i]"
                class="flex-1 p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white"
                :placeholder="`選択肢 ${i + 1}`"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1"
              >解説</label
            >
            <textarea
              v-model="newQ.explanation"
              rows="2"
              class="w-full p-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 ring-blue-200 outline-none"
              placeholder="解説を入力..."
            ></textarea>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition active:scale-95 disabled:opacity-50"
          >
            {{ loading ? "処理中..." : "データベースに追加する" }}
          </button>
        </form>
      </section>

      <JsonUploader />

      <section class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="font-bold text-slate-700">
            登録済み問題 ({{ filteredQuestions.length }}件)
          </h2>
          <input
            v-model="searchQuery"
            placeholder="検索 (年度, 番号, 文言)..."
            class="p-2 border rounded-lg text-sm w-64 shadow-sm"
          />
        </div>

        <div v-if="loadingData" class="text-center py-10 text-slate-400">
          読み込み中...
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="q in filteredQuestions"
            :key="q.id"
            class="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-blue-300 transition group relative"
          >
            <div v-if="editingId === q.id" class="space-y-3">
              <div
                class="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-2"
              >
                <p class="text-xs font-bold text-orange-600 mb-2">編集中...</p>
                <div class="grid grid-cols-2 gap-2 mb-2">
                  <input
                    v-model="editForm.examYear"
                    class="p-1 border rounded text-xs"
                  />
                  <input
                    v-model="editForm.questionNumber"
                    class="p-1 border rounded text-xs"
                  />
                </div>
                <textarea
                  v-model="editForm.text"
                  class="w-full p-1 border rounded text-xs mb-2"
                  rows="2"
                ></textarea>
                <div
                  v-for="(c, i) in editForm.choices"
                  :key="i"
                  class="flex items-center gap-1 mb-1"
                >
                  <input
                    type="checkbox"
                    :value="i"
                    v-model="editForm.correctIndices"
                    class="w-4 h-4"
                  />
                  <input
                    v-model="editForm.choices[i]"
                    class="flex-1 p-1 border rounded text-xs"
                  />
                </div>
                <textarea
                  v-model="editForm.explanation"
                  class="w-full p-1 border rounded text-xs"
                  rows="2"
                  placeholder="解説"
                ></textarea>
              </div>
              <div class="flex gap-2">
                <button
                  @click="handleUpdate(q.id)"
                  class="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded hover:bg-green-700"
                >
                  保存
                </button>
                <button
                  @click="cancelEdit"
                  class="flex-1 bg-slate-400 text-white text-xs font-bold py-2 rounded hover:bg-slate-500"
                >
                  キャンセル
                </button>
              </div>
            </div>

            <div v-else>
              <div class="flex justify-between items-start mb-2">
                <span
                  class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded"
                  >{{ q.examYear }} {{ q.questionNumber }}</span
                >
                <div
                  class="flex gap-2 opacity-0 group-hover:opacity-100 transition"
                >
                  <button
                    @click="startEdit(q)"
                    class="text-xs text-blue-500 font-bold hover:underline"
                  >
                    編集
                  </button>
                  <button
                    @click="handleDelete(q.id)"
                    class="text-xs text-red-500 font-bold hover:underline"
                  >
                    削除
                  </button>
                </div>
              </div>
              <p class="text-sm font-bold text-slate-800 mb-2">{{ q.text }}</p>
              <p class="text-xs text-slate-500 truncate">{{ q.explanation }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { useRouter } from "vue-router";
import { useNextNs } from "@/composables/useNextNs";
import { useAdmin } from "@/composables/useAdmin";
import { useMockExam } from "@/composables/useMockExam";
import JsonUploader from "@/components/JsonUploader.vue";
import type { Question } from "@/types";

const router = useRouter();
const {
  masterQuestions,
  fetchAllQuestions,
  loading: loadingData,
} = useNextNs();
const { addQuestion, updateQuestion, removeQuestion, loading } = useAdmin();

const {
  activeExam,
  fetchLatestExam,
  createMockExam,
  closeAndReleaseExam,
  deleteMockExam,
  currentAnswerCount, // ★追加
  fetchAnswerCount, // ★追加
} = useMockExam();
const newMockTitle = ref("");

const searchQuery = ref("");
const editingId = ref<string | null>(null);

const initNewQ = () => ({
  examYear: "",
  questionNumber: "",
  type: "general",
  text: "",
  choices: ["", "", "", "", ""],
  correctIndices: [] as number[],
  explanation: "",
  tags: [] as string[],
});
const newQ = reactive(initNewQ());
const editForm = reactive(initNewQ());

onMounted(async () => {
  await fetchAllQuestions();
  await fetchLatestExam();
  // ★追加: 模試があれば回答数を取得
  if (activeExam.value) {
    await fetchAnswerCount(activeExam.value.id);
  }
});

const handleCreateMock = async () => {
  if (!newMockTitle.value) return alert("タイトルを入力してください");
  await createMockExam(newMockTitle.value, 3, masterQuestions.value);
  newMockTitle.value = "";
  // 作成直後もカウント再取得
  if (activeExam.value) {
    await fetchAnswerCount(activeExam.value.id);
  }
};

const filteredQuestions = computed(() => {
  if (!searchQuery.value) return masterQuestions.value;
  const q = searchQuery.value.toLowerCase();
  return masterQuestions.value.filter(
    (item) =>
      item.text.toLowerCase().includes(q) ||
      item.examYear.includes(q) ||
      item.questionNumber.includes(q)
  );
});

const handleSubmitNew = async () => {
  if (newQ.correctIndices.length === 0) {
    alert("正解の選択肢にチェックを入れてください");
    return;
  }
  await addQuestion(newQ as any);
  Object.assign(newQ, initNewQ());
  window.location.reload();
};

const startEdit = (q: Question) => {
  editingId.value = q.id;
  const data = JSON.parse(JSON.stringify(q));
  while (data.choices.length < 5) data.choices.push("");
  Object.assign(editForm, data);
};

const cancelEdit = () => {
  editingId.value = null;
  Object.assign(editForm, initNewQ());
};

const handleUpdate = async (id: string) => {
  if (editForm.correctIndices.length === 0) {
    alert("正解を選択してください");
    return;
  }
  await updateQuestion(id, editForm as any);
  editingId.value = null;
  window.location.reload();
};

const handleDelete = async (id: string) => {
  await removeQuestion(id);
  window.location.reload();
};
</script>
