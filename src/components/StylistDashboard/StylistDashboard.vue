<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useStylistDashboard } from "./StylistDashboard";
import type { StylistDashboardProps } from "./StylistDashboard";
import { useHairLink } from "@/composables/useHairLink";
import { useNotifications } from "@/composables/useNotifications";

const props = defineProps<StylistDashboardProps>();
const emit = defineEmits([
  "update:salesPeriod",
  "update:scanInput",
  "show-scanner",
  "connect",
  "select-client",
  "update-reservation",
]);

const {
  stylistReservations,
  fetchStylistReservations,
  currentUser,
  fetchAllStylistLogs,
  fetchMyClients,
} = useHairLink();

const { addNotification } = useNotifications();
const lastReservationCount = ref(0);
const isInitialLoad = ref(true);

onMounted(async () => {
  if (currentUser.value?.uid) {
    fetchStylistReservations(currentUser.value.uid);
    fetchAllStylistLogs(currentUser.value.uid);
    fetchMyClients(currentUser.value.uid);

    await nextTick();
    setTimeout(() => {
      lastReservationCount.value = stylistReservations.value.length;
      isInitialLoad.value = false;
      if (Notification.permission !== "granted")
        Notification.requestPermission();
    }, 1500);
  }
});

watch(
  stylistReservations,
  (newVal) => {
    if (isInitialLoad.value) return;

    if (newVal.length > lastReservationCount.value) {
      const latest = newVal[newVal.length - 1];
      if (latest.createdBy !== currentUser.value?.uid) {
        const msg = `${latest.customerName || "ゲスト"}様\n${latest.date} ${
          latest.time
        }`;
        addNotification("reservation", "新しい予約が入りました", msg);
        if (Notification.permission === "granted")
          new Notification("HairLink: 新しい予約", { body: msg });
      }
    } else if (newVal.length < lastReservationCount.value) {
      addNotification(
        "cancel",
        "予約がキャンセルされました",
        "スケジュールを確認してください"
      );
      if (Notification.permission === "granted")
        new Notification("HairLink: 予約キャンセル", {
          body: "予約が取り消されました",
        });
    }
    lastReservationCount.value = newVal.length;
  },
  { deep: true }
);

const todaysReservations = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return stylistReservations.value
    .filter((r) => r.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
});

const isNextUp = (time: string) => {
  const now = new Date();
  const currentTimeVal = now.getHours() * 60 + now.getMinutes();
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m >= currentTimeVal;
};

const logicProps = { ...props, products: [], allStylistLogs: [] } as any;
const { isDanger, churnRiskClients, copyInviteMessage } =
  useStylistDashboard(logicProps);
</script>

<template>
  <div class="w-full max-w-full space-y-10 pb-24 relative">
    <section>
      <div class="flex justify-between items-center mb-5 px-1">
        <h2 class="font-bold text-lg text-slate-800 tracking-tight">
          本日の予定
        </h2>
        <span
          class="text-[10px] font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm"
        >
          {{ todaysReservations.length }} 件
        </span>
      </div>

      <div v-if="todaysReservations.length > 0" class="space-y-4">
        <div
          v-for="res in todaysReservations"
          :key="res.id"
          class="flex gap-4 items-stretch group"
        >
          <div class="flex flex-col items-center w-12 pt-1">
            <span class="text-sm font-bold text-slate-600 font-mono">{{
              res.time
            }}</span>
            <div
              class="w-[2px] flex-1 bg-slate-100 mt-2 rounded-full group-last:hidden"
            ></div>
          </div>

          <div
            class="flex-1 modern-card p-5 relative overflow-hidden transition-all"
            :class="{
              'ring-2 ring-slate-800 ring-offset-2':
                isNextUp(res.time) && todaysReservations.indexOf(res) === 0,
            }"
          >
            <div
              class="absolute left-0 top-0 bottom-0 w-1.5"
              :class="isNextUp(res.time) ? 'bg-slate-800' : 'bg-slate-200'"
            ></div>
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-slate-800 text-base">
                  {{ res.customerName || "ゲスト" }}
                  <span class="text-xs font-normal text-slate-400">様</span>
                </h3>
                <span
                  class="inline-block mt-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100"
                  >{{ res.menu || "メニュー未定" }}</span
                >
              </div>
              <button
                @click="emit('select-client', { customerId: res.customerId })"
                class="bg-slate-800 text-white text-[10px] font-bold px-4 py-2 rounded-lg shadow-sm active:scale-95"
              >
                カルテ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center"
      >
        <p class="text-4xl mb-3 grayscale opacity-80">☕️</p>
        <p class="text-sm font-bold text-slate-600">本日の予約はありません</p>
      </div>
    </section>

    <section>
      <h3 class="font-bold text-slate-800 text-sm mb-4 px-1">顧客連携</h3>
      <div
        class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-2 items-center"
      >
        <button
          @click="emit('show-scanner')"
          class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl hover:bg-slate-200 transition active:scale-95 text-slate-500"
        >
          📷
        </button>
        <div class="flex-1 bg-slate-50 rounded-xl flex items-center px-4 h-12">
          <input
            :value="scanInput"
            @input="(e: any) => emit('update:scanInput', e.target.value)"
            placeholder="お客様のIDを入力"
            class="bg-transparent w-full text-sm font-bold text-slate-700 outline-none"
          />
        </div>
        <button
          @click="emit('connect')"
          class="h-12 px-5 bg-slate-800 rounded-xl text-white text-xs font-bold active:scale-95 shadow-md"
        >
          連携
        </button>
      </div>
    </section>

    <section>
      <div class="flex justify-between items-end mb-4 px-1">
        <h3 class="font-bold text-slate-800 text-lg">顧客リスト</h3>
        <span class="text-xs font-bold text-slate-400"
          >{{ props.clientsWithSales.length }} 名</span
        >
      </div>

      <div class="space-y-3">
        <div
          v-for="client in props.clientsWithSales"
          :key="client.id"
          @click="emit('select-client', client)"
          class="group bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-200 transition active:scale-[0.99]"
        >
          <div class="flex items-center gap-4 min-w-0">
            <div
              class="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0 transition-transform group-hover:scale-105"
              :class="
                isDanger(client.lastVisit) ? 'bg-slate-300' : 'bg-slate-800'
              "
            >
              {{ client.customerName.charAt(0) }}
            </div>
            <div class="min-w-0">
              <p class="font-bold text-slate-800 text-sm truncate">
                {{ client.customerName }}
              </p>
              <div class="flex items-center gap-2 mt-1">
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="
                    isDanger(client.lastVisit) ? 'bg-rose-400' : 'bg-green-400'
                  "
                ></span>
                <p class="text-[10px] text-slate-400 truncate">
                  最終: {{ client.lastVisit || "新規" }}
                </p>
              </div>
            </div>
          </div>
          <div class="text-right flex-shrink-0 pl-2">
            <p class="text-[9px] text-slate-400 mb-1 font-bold tracking-wider">
              次回予約
            </p>
            <input
              type="date"
              :value="client.nextReservation"
              @click.stop
              @change="(e) => emit('update-reservation', client, e)"
              class="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-slate-400 w-24 text-center"
            />
          </div>
        </div>

        <div
          v-if="props.clientsWithSales.length === 0"
          class="text-center py-10 text-slate-400 text-xs"
        >
          <p class="mb-2">📭</p>
          連携済みの顧客はいません
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modern-card {
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 4px 15px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}
</style>
