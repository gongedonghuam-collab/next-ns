<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import useHomeView from "./HomeView";
import LogList from "@/components/LogList/LogList.vue";
import Calendar from "@/components/Calendar/Calendar.vue";
import QRCodeModal from "@/components/QRCodeModal/QRCodeModal.vue";
import NewLogModal from "@/components/NewLogModal/NewLogModal.vue";
import QRScannerModal from "@/components/QRScannerModal/QRScannerModal.vue";
import ReservationModal from "@/components/ReservationModal/ReservationModal.vue";
import NotificationBell from "@/components/NotificationBell/NotificationBell.vue";
import CustomerDashboard from "@/components/CustomerDashboard/CustomerDashboard.vue";
import StylistDashboard from "@/components/StylistDashboard/StylistDashboard.vue";
import SettingsTab from "@/components/SettingsTab/SettingsTab.vue";
import TheBottomNav from "@/components/TheBottomNav/TheBottomNav.vue";
import InventoryDashboard from "@/components/InventoryDashboard/InventoryDashboard.vue";
import AccountingPanel from "@/components/Premium/AccountingPanel.vue";
import { useNotifications } from "@/composables/useNotifications";

const router = useRouter();
const { requestNotificationPermission } = useNotifications();

const {
  currentTab,
  salesPeriod,
  currentUser,
  logs,
  allStylistLogs,
  clientsWithSales,
  loading,
  activeClientId,
  activeClientName,
  clientReservations,
  activeConnectionId,
  showQR,
  scanInput,
  handleConnect,
  handleQRDetect,
  logout,
  selectClient,
  selectClientFromCalendar,
  goHome,
  onNextDateChange,
  handleDeleteLog,
  handleCancelReservation,
  monthlySalesData,
  currentMonthSales,
  calendarEvents,
  myReservation,
  editName,
  editTheme,
  saveSettings,
  currentTheme,
  THEMES,
} = useHomeView();

const newLogModalRef = ref<any>(null);
const scannerModalRef = ref<any>(null);
const reservationModalRef = ref<any>(null);

onMounted(async () => {
  await requestNotificationPermission();
});

const saveAndClose = () => {
  newLogModalRef.value?.close();
};
const handleSaveSettings = (data: any) => {
  editName.value = data.name;
  editTheme.value = data.theme;
  saveSettings();
};
const safeLogout = async () => {
  try {
    await logout();
    window.location.href = "/login";
  } catch {
    window.location.href = "/login";
  }
};
const openProxyReservation = () => {
  if (!activeClientId.value) return;
  reservationModalRef.value?.show({
    isProxy: true,
    stylistId: currentUser.value.uid,
    customer: { uid: activeClientId.value, name: activeClientName.value },
  });
};
</script>

<template>
  <div
    class="min-h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans pb-32 overflow-x-hidden"
  >
    <header
      class="fixed top-0 left-0 right-0 z-40 glass h-16 transition-all duration-300"
    >
      <div
        class="max-w-lg mx-auto px-6 h-full flex justify-between items-center"
      >
        <h1
          class="font-bold text-xl tracking-tight cursor-pointer flex items-center gap-3 group"
          @click="goHome"
        >
          <div
            class="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform"
          >
            H
          </div>
          <span class="text-slate-800 font-extrabold text-lg">HairLink</span>
        </h1>
        <div class="flex items-center gap-4">
          <NotificationBell />
          <button
            @click="safeLogout"
            class="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
            title="ログアウト"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-lg mx-auto px-5 pt-24 min-h-[calc(100vh-80px)]">
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-40"
      >
        <div
          class="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"
        ></div>
      </div>

      <div v-else class="w-full">
        <div class="animate-enter w-full">
          <div v-show="currentTab === 'home'" class="w-full">
            <CustomerDashboard
              v-if="currentUser?.role === 'customer'"
              :currentTheme="currentTheme"
              :logs="logs"
              :myReservation="myReservation"
              :currentUser="currentUser"
              @show-qr="showQR = true"
              @delete-log="handleDeleteLog"
            />
            <div v-else-if="currentUser?.role === 'stylist'" class="w-full">
              <StylistDashboard
                v-if="!activeClientId"
                :currentTheme="currentTheme"
                :monthlySalesData="monthlySalesData"
                :currentMonthSales="currentMonthSales"
                :salesPeriod="salesPeriod"
                :clientsWithSales="clientsWithSales"
                :scanInput="scanInput"
                @update:salesPeriod="salesPeriod = $event"
                @update:scanInput="scanInput = $event"
                @show-scanner="scannerModalRef?.show()"
                @connect="handleConnect"
                @select-client="selectClient"
                @update-reservation="onNextDateChange"
              />
              <div v-else class="w-full animate-enter">
                <div
                  class="flex items-center gap-2 mb-6 cursor-pointer group inline-flex"
                  @click="goHome"
                >
                  <div
                    class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-50 transition shadow-sm"
                  >
                    ←
                  </div>
                  <span
                    class="text-sm font-bold text-slate-500 group-hover:text-slate-800 transition"
                    >戻る</span
                  >
                </div>
                <div class="mb-6 flex justify-between items-end">
                  <div>
                    <p
                      class="text-[10px] text-slate-400 font-bold mb-1 tracking-widest uppercase"
                    >
                      CLIENT PROFILE
                    </p>
                    <h2
                      class="text-3xl font-bold text-slate-800 tracking-tight"
                    >
                      {{ activeClientName }}
                      <span class="text-lg font-normal text-slate-400">様</span>
                    </h2>
                  </div>
                  <button
                    @click="openProxyReservation"
                    class="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-200 active:scale-95"
                  >
                    + 予約作成
                  </button>
                </div>
                <div class="modern-card p-6 mb-8 overflow-hidden relative">
                  <div
                    class="absolute top-0 left-0 w-1.5 h-full bg-slate-900"
                  ></div>
                  <p
                    class="text-xs font-bold text-slate-400 mb-3 tracking-wide"
                  >
                    次回予約
                  </p>
                  <div v-if="clientReservations.length > 0" class="space-y-3">
                    <div
                      v-for="res in clientReservations"
                      :key="res.id"
                      class="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100"
                    >
                      <div>
                        <p class="font-bold text-slate-800 text-base font-mono">
                          {{ res.date }}
                          <span class="ml-2 text-slate-500">{{
                            res.time
                          }}</span>
                        </p>
                        <p
                          class="text-xs text-slate-500 font-medium mt-1 bg-white inline-block px-2 py-0.5 rounded border border-slate-200"
                        >
                          {{ res.menu }}
                        </p>
                      </div>
                      <button
                        @click="handleCancelReservation(res.id)"
                        class="text-[10px] text-red-500 font-bold hover:bg-red-50 px-3 py-1.5 rounded-full transition"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                  <div
                    v-else
                    class="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200"
                  >
                    予約はありません
                  </div>
                </div>
                <div class="flex items-center justify-between mb-4 px-1">
                  <h3 class="font-bold text-slate-700 text-lg">施術カルテ</h3>
                  <span
                    class="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-100"
                    >{{ logs.length }} records</span
                  >
                </div>
                <LogList
                  :logs="logs"
                  :current-user-id="currentUser?.uid"
                  :user-role="'stylist'"
                  @delete="handleDeleteLog"
                />
              </div>
            </div>
          </div>
          <div v-if="currentTab === 'sales'" class="w-full">
            <div class="mb-6 px-1">
              <h2 class="font-bold text-slate-800 text-2xl tracking-tight">
                経営管理
              </h2>
              <p class="text-xs text-slate-400 mt-1 font-medium">
                Sales & Profit
              </p>
            </div>
            <AccountingPanel
              :all-logs="allStylistLogs"
              :monthly-sales-data="monthlySalesData"
              :sales-period="salesPeriod"
              :chart-color="currentTheme.accent.replace('bg-', '')"
              @update:salesPeriod="salesPeriod = $event"
            />
          </div>
          <div v-show="currentTab === 'calendar'">
            <div class="mb-6 px-1">
              <h2 class="font-bold text-slate-800 text-2xl tracking-tight">
                予約カレンダー
              </h2>
              <p class="text-xs text-slate-400 mt-1 font-medium">Schedule</p>
            </div>
            <Calendar
              :events="calendarEvents"
              @event-click="selectClientFromCalendar"
            />
          </div>
          <div v-if="currentTab === 'inventory'"><InventoryDashboard /></div>
          <div v-show="currentTab === 'settings'">
            <div class="mb-6 px-1">
              <h2 class="font-bold text-slate-800 text-2xl tracking-tight">
                設定
              </h2>
            </div>
            <SettingsTab
              :currentUser="currentUser"
              :currentTheme="currentTheme"
              :THEMES="THEMES"
              @saved="handleSaveSettings"
            />
          </div>
        </div>
        <div
          v-if="currentUser?.role === 'customer' || activeClientId"
          class="fixed bottom-28 right-6 z-50 transition-transform duration-300 hover:scale-105 active:scale-95"
        >
          <button
            @click="newLogModalRef?.show()"
            class="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl shadow-slate-400/50 flex items-center justify-center text-3xl hover:bg-slate-800 transition"
          >
            +
          </button>
        </div>
        <TheBottomNav
          :currentTheme="currentTheme"
          :currentTab="currentTab"
          :activeClientId="activeClientId"
          :currentUserRole="currentUser?.role"
          @update:currentTab="currentTab = $event"
          @go-home="goHome"
        />
        <NewLogModal
          ref="newLogModalRef"
          :currentUser="currentUser"
          :currentTheme="currentTheme"
          :targetCustomerId="activeClientId"
          :targetConnectionId="activeConnectionId"
          @saved="saveAndClose"
        />
        <QRCodeModal
          v-if="showQR"
          :uid="currentUser?.uid"
          @close="showQR = false"
        />
        <QRScannerModal ref="scannerModalRef" @detect="handleQRDetect" />
        <ReservationModal ref="reservationModalRef" />
      </div>
    </main>
  </div>
</template>

<style>
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
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
