<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import LogList from "@/components/LogList/LogList.vue";
import ReservationModal from "@/components/ReservationModal/ReservationModal.vue";
import { useHairLink } from "@/composables/useHairLink";
import { useNotifications } from "@/composables/useNotifications";
import {
  useCustomerDashboard,
  type CustomerDashboardProps,
} from "./CustomerDashboard";

defineProps<CustomerDashboardProps>();
const emit = defineEmits(["show-qr", "delete-log"]);

// ★修正: useHairLinkから正しく関数を取得
const { currentUser, cancelReservation, myReservation } = useHairLink();
const { addNotification } = useNotifications();

const {
  isIdVisible,
  toggleIdVisibility,
  reservationModalRef,
  startLineLink,
  unlinkLine,
  isLinking,
  isUnlinking,
} = useCustomerDashboard();

const openReservation = () => {
  reservationModalRef.value?.show();
};

const showToast = ref(false);
const toastMessage = ref("");
const triggerToast = (msg: string) => {
  toastMessage.value = msg;
  showToast.value = true;
  setTimeout(() => (showToast.value = false), 3000);
};

const isInitialLoad = ref(true);
onMounted(() => {
  setTimeout(() => {
    isInitialLoad.value = false;
  }, 1500);
});

watch(
  () => myReservation.value,
  (newVal, oldVal) => {
    if (isInitialLoad.value) return;
    if (newVal && !oldVal) {
      if (newVal.createdBy !== currentUser.value?.uid) {
        triggerToast("美容師から予約が入りました");
        addNotification(
          "reservation",
          "予約作成",
          `担当者が予約を作成しました。\n${newVal.date} ${newVal.time}`
        );
      }
    } else if (!newVal && oldVal) {
      if (oldVal.createdBy !== currentUser.value?.uid) {
        addNotification("cancel", "予約キャンセル", "予約が取り消されました");
      }
    }
  },
  { deep: true }
);

const handleCancel = async (resId: string) => {
  if (!confirm("予約をキャンセルしてもよろしいですか？")) return;
  await cancelReservation(resId);
  triggerToast("予約をキャンセルしました");
  addNotification(
    "cancel",
    "予約キャンセル",
    "お客様の操作で予約を取り消しました"
  );
};

const copyMemberId = async (uid: string) => {
  if (!uid) return;
  await navigator.clipboard.writeText(uid);
  triggerToast("会員IDをコピーしました！");
};

const onReservationSaved = () => {
  triggerToast("予約が完了しました！");
  addNotification("reservation", "予約完了", "Web予約を受け付けました");
};
</script>

<template>
  <div class="w-full max-w-full space-y-8 pb-24 relative animate-fade-in">
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-800/95 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl text-[10px] font-bold border border-white/20 flex items-center gap-2"
      >
        <span>✨</span> {{ toastMessage }}
      </div>
    </Transition>

    <div class="px-2 pt-2 flex justify-between items-center">
      <div>
        <p
          class="text-[10px] font-bold text-slate-400 tracking-widest mb-0.5 uppercase"
        >
          Member Status
        </p>
        <h2 class="text-xl font-bold text-slate-800 tracking-tight">
          {{ currentUser?.name || "ゲスト" }}
          <span class="text-sm font-normal text-slate-400">様</span>
        </h2>
      </div>
      <button
        @click="$emit('show-qr')"
        class="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-lg hover:shadow-md transition active:scale-90 text-slate-700"
      >
        📱
      </button>
    </div>

    <div class="px-1">
      <div
        class="relative w-full aspect-[1.618/1] rounded-[20px] overflow-hidden shadow-2xl shadow-slate-200/80 cursor-pointer transition-all duration-500 hover:scale-[1.01]"
        @click="toggleIdVisibility"
      >
        <div class="absolute inset-0 bg-slate-900"></div>
        <div
          class="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black opacity-90"
        ></div>
        <div
          class="absolute -top-[50%] -right-[50%] w-full h-full bg-gradient-to-b from-white/10 to-transparent transform rotate-45 blur-3xl"
        ></div>
        <div
          class="absolute inset-0 p-6 flex flex-col justify-between text-white z-10"
        >
          <div class="flex justify-between items-start">
            <div class="space-y-2 w-full pr-4">
              <p
                class="text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase mb-1"
              >
                HairLink Member Card
              </p>
              <div class="flex items-center gap-2">
                <div v-if="isIdVisible" class="w-full">
                  <p
                    class="font-mono text-xs sm:text-sm tracking-wider text-slate-200 break-all leading-tight"
                  >
                    {{ currentUser?.uid || "UNKNOWN" }}
                  </p>
                  <button
                    @click.stop="copyMemberId(currentUser?.uid)"
                    class="mt-2 text-[9px] bg-white/10 px-2 py-0.5 rounded border border-white/5 text-slate-300 hover:bg-white/20 transition flex items-center gap-1 w-fit"
                  >
                    <span>📋</span> COPY ID
                  </button>
                </div>
                <p v-else class="font-mono text-xl tracking-widest opacity-40">
                  •••• ••••
                </p>
                <span
                  v-if="!isIdVisible"
                  class="text-[9px] bg-white/10 px-1.5 py-0.5 rounded border border-white/5 text-slate-300 whitespace-nowrap"
                  >TAP TO SHOW</span
                >
              </div>
            </div>
            <div
              class="w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80 shadow-inner border border-yellow-300/30 flex-shrink-0"
            ></div>
          </div>
          <div class="flex justify-between items-end">
            <div>
              <p
                class="text-[9px] text-slate-500 mb-1 font-medium tracking-wide uppercase"
              >
                Member Rank
              </p>
              <div class="flex items-center gap-1.5">
                <div
                  class="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]"
                ></div>
                <p
                  class="text-xs sm:text-sm font-bold tracking-wide text-slate-100"
                >
                  Regular
                </p>
              </div>
            </div>
            <button
              @click.stop="$emit('show-qr')"
              class="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-white/20 transition active:scale-95 whitespace-nowrap"
            >
              QRを表示
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!currentUser?.isLineLinked" class="px-1">
      <div
        class="modern-card p-4 flex items-center justify-between bg-[#06C755]/5 border-[#06C755]/20 shadow-none"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-full bg-[#06C755] flex items-center justify-center text-white text-xl shadow-md"
          >
            L
          </div>
          <div>
            <p class="text-xs font-bold text-slate-700">LINE連携</p>
            <p class="text-[10px] text-slate-500">予約通知を受け取る</p>
          </div>
        </div>
        <button
          @click="startLineLink"
          class="text-[10px] font-bold bg-[#06C755] text-white px-4 py-2 rounded-full hover:bg-[#05b34c] transition shadow-sm active:scale-95"
        >
          連携する
        </button>
      </div>
    </div>
    <div v-else class="px-1">
      <div
        class="modern-card p-3 flex items-center justify-between bg-slate-50 border-slate-200"
      >
        <div class="flex items-center gap-2">
          <span class="text-[#06C755] text-lg">●</span>
          <p class="text-[10px] font-bold text-slate-500">LINE連携済み</p>
        </div>
        <button
          @click="unlinkLine"
          class="text-[9px] text-slate-400 underline hover:text-slate-600"
        >
          解除
        </button>
      </div>
    </div>

    <div class="px-1">
      <div
        class="modern-card p-6 bg-slate-900 text-white relative overflow-hidden"
      >
        <div class="relative z-10 flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📅</span>
            <h3 class="text-sm font-black tracking-tight">スマートなWeb予約</h3>
          </div>
          <p class="text-[10px] text-slate-400 leading-relaxed">
            24時間いつでも空き状況を確認できます。ご希望の日時を選択して、すぐに予約を確定しましょう。
          </p>
          <button
            @click="openReservation"
            class="w-full bg-white text-slate-900 text-xs font-black py-3 rounded-xl shadow-lg hover:bg-slate-100 transition active:scale-[0.98]"
          >
            新しく予約を入れる →
          </button>
        </div>
        <div
          class="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl"
        ></div>
      </div>
    </div>

    <div class="px-1">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-base text-slate-800 flex items-center gap-2">
          <span class="w-1 h-4 bg-slate-800 rounded-full"></span>予約状況
        </h3>
      </div>
      <div
        v-if="myReservation"
        class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div class="p-5 flex justify-between items-center relative">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
          <div class="flex-1 pl-2">
            <p
              class="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider"
            >
              Appointment
            </p>
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-3xl font-black text-slate-800">{{
                new Date(myReservation.date).getDate()
              }}</span>
              <span class="text-xs font-bold text-slate-500 uppercase">{{
                new Date(myReservation.date).toLocaleString("ja-JP", {
                  month: "short",
                })
              }}</span>
              <span class="ml-2 text-lg font-bold text-slate-700 font-mono">{{
                myReservation.time
              }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-600">
              <span class="bg-slate-100 px-1.5 py-0.5 rounded font-bold"
                >MENU</span
              ><span>{{ myReservation.menu || "未定" }}</span>
            </div>
          </div>
        </div>
        <div
          class="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex justify-between items-center"
        >
          <span
            class="text-[9px] font-bold text-teal-600 flex items-center gap-1.5"
            ><span
              class="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"
            ></span
            >予約確定済み</span
          >
          <button
            v-if="
              !myReservation.createdBy ||
              myReservation.createdBy === currentUser?.uid
            "
            @click="handleCancel(myReservation.id)"
            class="text-[10px] font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded transition"
          >
            キャンセル
          </button>
          <span v-else class="text-[9px] text-slate-400 italic"
            >店舗側受付分</span
          >
        </div>
      </div>
      <div
        v-else
        class="modern-card p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/10 transition border-dashed border-2 bg-white"
        @click="openReservation"
      >
        <p class="text-sm font-bold text-slate-500">現在、予約はありません</p>
        <p class="text-[9px] text-slate-400 mt-2">
          タップして予約を入れましょう
        </p>
      </div>
    </div>

    <div class="px-1">
      <h3
        class="font-bold text-base text-slate-800 mb-4 flex items-center gap-2"
      >
        <span class="w-1 h-4 bg-slate-800 rounded-full"></span>履歴
      </h3>
      <LogList
        :logs="logs"
        :current-user-id="currentUser?.uid"
        :user-role="currentUser?.role"
        @delete="(id) => $emit('delete-log', id)"
      />
    </div>

    <ReservationModal ref="reservationModalRef" @saved="onReservationSaved" />
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
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
.modern-card {
  border-radius: 1.5rem;
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
}
</style>
