import { ref, computed, watch } from "vue";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  limit,
  getDocs,
  setDoc,
  increment,
  deleteField,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, auth, storage } from "../firebase";

const STRIPE_PRICE_ID = "price_1SeBB6CK1WOIBQsLdtqQjSLt";
const ADMIN_UID = "rpBd7AHuE9cBZwQrr96wIFSmM6z1";

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

// グローバルステート
const loading = ref(false);
const currentUser = ref<any>(null);
const logs = ref<any[]>([]);
const allStylistLogs = ref<any[]>([]);
const clients = ref<any[]>([]);
const myReservations = ref<any[]>([]);
const stylistReservations = ref<any[]>([]);
const clientReservations = ref<any[]>([]);
const myReservation = ref<any>(null);
const products = ref<any[]>([]);
const myStylists = ref<any[]>([]);
const isPro = ref(false);
const autoMessageSettings = ref<any>(null);

let unsubscribeLogs: Unsubscribe | null = null;
let unsubscribeAllStylistLogs: Unsubscribe | null = null;
let unsubscribeInventory: Unsubscribe | null = null;
let unsubscribeStylistReservations: Unsubscribe | null = null;
let unsubscribeMyClients: Unsubscribe | null = null;
let currentListeningStylistId: string | null = null;
let currentLogsTargetId: string | null = null;
let unsubscribeClientReservations: Unsubscribe | null = null;
let unsubscribeMessageSettings: Unsubscribe | null = null;

export function useHairLink() {
  const nextReservation = computed(() => {
    if (myReservations.value.length === 0) return null;
    return myReservations.value[0];
  });

  const fetchUserProfile = async (uid: string) => {
    loading.value = true;
    const safetyTimer = setTimeout(() => {
      if (loading.value) loading.value = false;
    }, 5000);
    try {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        currentUser.value = { uid, ...docSnap.data() };
        checkSubscriptionStatus(uid);
      }
    } catch (e) {
      console.error(e);
    } finally {
      clearTimeout(safetyTimer);
      loading.value = false;
    }
  };

  const checkSubscriptionStatus = (uid: string) => {
    const q = query(
      collection(db, "customers", uid, "subscriptions"),
      where("status", "in", ["active", "trialing"])
    );
    onSnapshot(q, (snapshot) => {
      const hasSubscription = !snapshot.empty;
      if (currentUser.value?.uid !== ADMIN_UID) isPro.value = hasSubscription;
      if (currentUser.value) currentUser.value.isPro = isPro.value;
    });
  };

  const debugTogglePro = () => {
    if (currentUser.value?.uid !== ADMIN_UID) {
      console.warn("権限なし");
      return;
    }
    isPro.value = !isPro.value;
    if (currentUser.value) currentUser.value.isPro = isPro.value;
    alert(isPro.value ? "Pro有効化" : "Pro無効化");
  };

  // --- 予約関連 ---

  // ★予約作成
  const makeReservation = async (
    data: any,
    targetCustomer?: { uid: string; name: string }
  ) => {
    const user = auth.currentUser;
    if (!user) return;

    const customerId = targetCustomer ? targetCustomer.uid : user.uid;
    const customerName = targetCustomer
      ? targetCustomer.name
      : currentUser.value.name || "お客様";
    const createdBy = user.uid; // 作成者ID

    await addDoc(collection(db, "reservations"), {
      ...data,
      customerId,
      customerName,
      createdBy,
      status: "confirmed",
      createdAt: serverTimestamp(),
    });
    return true;
  };

  // ★予約キャンセル (即時反映)
  const cancelReservation = async (reservationId: string) => {
    if (!reservationId) return;

    // 即座に画面から消す
    myReservations.value = myReservations.value.filter(
      (r) => r.id !== reservationId
    );
    stylistReservations.value = stylistReservations.value.filter(
      (r) => r.id !== reservationId
    );
    clientReservations.value = clientReservations.value.filter(
      (r) => r.id !== reservationId
    );
    if (myReservation.value && myReservation.value.id === reservationId)
      myReservation.value = null;

    try {
      await deleteDoc(doc(db, "reservations", reservationId));
    } catch (e: any) {
      console.error("削除失敗", e);
      if (e.code === "permission-denied") alert("削除権限がありません");
      else alert("削除に失敗しました");
    }
  };

  const fetchStylistReservations = (stylistId: string) => {
    if (unsubscribeStylistReservations) unsubscribeStylistReservations();
    const q = query(
      collection(db, "reservations"),
      where("stylistId", "==", stylistId),
      where("status", "==", "confirmed")
    );
    unsubscribeStylistReservations = onSnapshot(q, (snap) => {
      stylistReservations.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a: any, b: any) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        );
    });
  };

  const fetchMyReservations = (customerId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, "reservations"),
      where("customerId", "==", customerId),
      where("status", "==", "confirmed")
    );
    onSnapshot(q, (snap) => {
      myReservations.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.date >= today)
        .sort(
          (a: any, b: any) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        );
    });
  };

  const fetchMyReservation = (customerId: string) => {
    const q = query(
      collection(db, "reservations"),
      where("customerId", "==", customerId),
      where("status", "==", "confirmed")
    );
    onSnapshot(q, (snap) => {
      const today = new Date().toISOString().slice(0, 10);
      const future = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.date >= today)
        .sort(
          (a: any, b: any) =>
            a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
        );
      if (future.length > 0) myReservation.value = future[0];
      else checkManualReservation(customerId);
    });
  };

  const checkManualReservation = (customerId: string) => {
    const q = query(
      collection(db, "connections"),
      where("customerId", "==", customerId),
      limit(1)
    );
    onSnapshot(q, (snap) => {
      if (!snap.empty && snap.docs[0].data().nextReservation) {
        myReservation.value = {
          date: snap.docs[0].data().nextReservation,
          time: "",
          menu: "次回予約",
        };
      } else {
        myReservation.value = null;
      }
    });
  };

  const fetchClientReservations = (customerId: string) => {
    if (unsubscribeClientReservations) unsubscribeClientReservations();
    const today = new Date().toISOString().slice(0, 10);
    const q = query(
      collection(db, "reservations"),
      where("customerId", "==", customerId),
      where("status", "==", "confirmed")
    );
    unsubscribeClientReservations = onSnapshot(q, (snap) => {
      clientReservations.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((d: any) => d.date >= today)
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
    });
  };

  const getAvailableSlots = async (stylistId: string, date: string) => {
    const slots: TimeSlot[] = [];
    try {
      const q = query(
        collection(db, "reservations"),
        where("stylistId", "==", stylistId),
        where("date", "==", date)
      );
      const snapshot = await getDocs(q);
      const bookedTimes = snapshot.docs.map((d) => d.data().time);
      for (let h = 10; h < 22; h++) {
        const t1 = `${h}:00`,
          t2 = `${h}:30`;
        slots.push({ time: t1, isAvailable: !bookedTimes.includes(t1) });
        slots.push({ time: t2, isAvailable: !bookedTimes.includes(t2) });
      }
    } catch (e) {
      console.error(e);
    }
    return slots;
  };

  const fetchMyClients = (stylistId: string) => {
    if (unsubscribeMyClients) unsubscribeMyClients();
    const q = query(
      collection(db, "connections"),
      where("stylistId", "==", stylistId)
    );
    unsubscribeMyClients = onSnapshot(q, (snap) => {
      const unique = new Map();
      snap.docs.forEach((doc) => {
        if (!unique.has(doc.data().customerId))
          unique.set(doc.data().customerId, { id: doc.id, ...doc.data() });
      });
      clients.value = Array.from(unique.values());
    });
  };

  const connectUser = async (stylistId: string, customerCode: string) => {
    const snap = await getDoc(doc(db, "users", customerCode));
    if (!snap.exists() || snap.data().role !== "customer")
      throw new Error("無効なIDです");
    const q = query(
      collection(db, "connections"),
      where("stylistId", "==", stylistId),
      where("customerId", "==", customerCode)
    );
    const existing = await getDocs(q);
    if (!existing.empty) return true;
    await addDoc(collection(db, "connections"), {
      stylistId,
      customerId: customerCode,
      customerName: snap.data().name,
      connectedAt: serverTimestamp(),
      lastVisit: null,
      nextReservation: null,
    });
    return true;
  };

  const fetchMyStylists = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(
      collection(db, "connections"),
      where("customerId", "==", user.uid)
    );
    const snap = await getDocs(q);
    const list = [];
    for (const d of snap.docs) {
      const styl = await getDoc(doc(db, "users", d.data().stylistId));
      if (styl.exists())
        list.push({ id: styl.id, name: styl.data().name, connectionId: d.id });
    }
    myStylists.value = list;
  };

  const addLog = async (
    logData: any,
    imageFiles: File[],
    connectionId?: string
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    let imageUrls: string[] = [];
    if (imageFiles.length > 0) {
      const promises = imageFiles.map((f) =>
        uploadFile(`logs/${user.uid}/${Date.now()}_${f.name}`, f)
      );
      imageUrls = await Promise.all(promises);
    }
    await addDoc(collection(db, "logs"), {
      ...logData,
      authorId: user.uid,
      authorName: currentUser.value.name || "担当者",
      createdAt: serverTimestamp(),
      imageUrls,
      imageUrl: imageUrls[0] || null,
    });
    if (connectionId)
      await updateDoc(doc(db, "connections", connectionId), {
        lastVisit: logData.date,
      });
  };

  const deleteLog = async (id: string) => {
    logs.value = logs.value.filter((l) => l.id !== id);
    allStylistLogs.value = allStylistLogs.value.filter((l) => l.id !== id);
    try {
      await deleteDoc(doc(db, "logs", id));
    } catch (e) {
      alert("削除エラー");
    }
  };

  const fetchLogs = (targetUid: string) => {
    if (!targetUid) {
      logs.value = [];
      return;
    }
    if (currentLogsTargetId === targetUid && logs.value.length > 0) return;
    if (unsubscribeLogs) {
      unsubscribeLogs();
      unsubscribeLogs = null;
    }
    currentLogsTargetId = targetUid;
    const q = query(
      collection(db, "logs"),
      where("customerId", "==", targetUid)
    );
    unsubscribeLogs = onSnapshot(q, (snap) => {
      const temp = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      temp.sort(
        (a: any, b: any) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      logs.value = [...temp];
    });
  };

  const fetchAllStylistLogs = (stylistId: string) => {
    if (currentListeningStylistId === stylistId && unsubscribeAllStylistLogs)
      return;
    if (unsubscribeAllStylistLogs) {
      unsubscribeAllStylistLogs();
      unsubscribeAllStylistLogs = null;
      currentListeningStylistId = null;
    }
    const q = query(collection(db, "logs"), where("authorId", "==", stylistId));
    unsubscribeAllStylistLogs = onSnapshot(q, (snap) => {
      allStylistLogs.value = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    });
    currentListeningStylistId = stylistId;
  };

  const fetchInventory = () => {
    const user = auth.currentUser;
    if (!user || unsubscribeInventory) return;
    const q = query(
      collection(db, "inventories"),
      where("ownerId", "==", user.uid)
    );
    unsubscribeInventory = onSnapshot(q, (snap) => {
      products.value = snap.docs.map((d) => ({ ...d.data() }));
    });
  };

  const saveInventoryItem = async (
    code: string,
    name: string,
    stock: number,
    unitPrice: number
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    await setDoc(
      doc(db, "inventories", `${user.uid}_${code}`),
      {
        ownerId: user.uid,
        code,
        name,
        stock: Number(stock),
        unitPrice: Number(unitPrice),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const deleteInventoryItem = async (code: string) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "inventories", `${user.uid}_${code}`));
  };

  const consumeStock = async (
    code: string,
    name: string,
    quantity: number = 1
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = doc(db, "inventories", `${user.uid}_${code}`);
    const snap = await getDoc(ref);
    if (snap.exists())
      await updateDoc(ref, {
        stock: increment(-quantity),
        lastUsedAt: serverTimestamp(),
      });
    else
      await setDoc(ref, {
        ownerId: user.uid,
        code,
        name,
        stock: -quantity,
        unitPrice: 0,
        createdAt: serverTimestamp(),
        lastUsedAt: serverTimestamp(),
      });
  };

  const searchProduct = async (code: string) => {
    try {
      const func = getFunctions();
      const call = httpsCallable(func, "searchProduct");
      const res: any = await call({ code });
      if (res.data.name) return res.data.name;
    } catch (e) {
      console.warn(e);
    }
    return "";
  };

  const createCheckoutSession = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Login required");
    try {
      try {
        await updateDoc(doc(db, "customers", user.uid), {
          stripeId: deleteField(),
          stripeLink: deleteField(),
        });
      } catch (e) {}
      const docRef = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
        {
          price: STRIPE_PRICE_ID,
          success_url: window.location.origin,
          cancel_url: window.location.origin,
          mode: "subscription",
          allow_promotion_codes: true,
        }
      );
      onSnapshot(docRef, (snap) => {
        const { url } = snap.data() || {};
        if (url) window.location.assign(url);
      });
    } catch (e) {
      alert("Error");
    }
  };
  const openCustomerPortal = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const func = getFunctions();
      const call = httpsCallable(
        func,
        "ext-firestore-stripe-payments-createPortalLink"
      );
      const { data }: any = await call({ returnUrl: window.location.origin });
      window.location.assign(data.url);
    } catch (e) {
      alert("Error");
    }
  };

  const uploadFile = async (path: string, file: File) => {
    const ref = storageRef(storage, path);
    await uploadBytes(ref, file);
    return await getDownloadURL(ref);
  };
  const updateUserProfile = async (uid: string, data: any) => {
    await updateDoc(doc(db, "users", uid), data);
    if (currentUser.value)
      currentUser.value = { ...currentUser.value, ...data };
    return true;
  };
  const getStylistPublicProfile = async (id: string) => {
    const snap = await getDoc(doc(db, "users", id));
    return snap.exists() ? snap.data() : null;
  };
  const saveAutoMessageSettings = async (settings: any) => {
    if (!auth.currentUser) return;
    await setDoc(
      doc(db, "users", auth.currentUser.uid, "system", "auto_messages"),
      settings,
      { merge: true }
    );
  };
  const fetchAutoMessageSettings = (stylistId: string) => {
    const ref = doc(db, "users", stylistId, "system", "auto_messages");
    unsubscribeMessageSettings = onSnapshot(ref, (s) => {
      if (s.exists()) autoMessageSettings.value = s.data();
      else
        autoMessageSettings.value = {
          enabled: true,
          template: "{name}様\n\nありがとうございました！",
        };
    });
  };
  const updateNextReservation = async (id: string, date: string) => {
    await updateDoc(doc(db, "connections", id), { nextReservation: date });
  };

  const getFinancialStats = computed(() => ({
    totalSales: 0,
    totalCost: 0,
    grossProfit: 0,
  }));

  watch(
    () => currentUser.value,
    (u) => {
      if (u?.role === "stylist") {
        fetchAllStylistLogs(u.uid);
        fetchMyClients(u.uid);
        fetchInventory();
        fetchAutoMessageSettings(u.uid);
        fetchStylistReservations(u.uid);
      }
    },
    { immediate: true }
  );

  return {
    loading,
    currentUser,
    isPro,
    logs,
    allStylistLogs,
    clients,
    myReservations,
    stylistReservations,
    clientReservations,
    nextReservation,
    myStylists,
    products,
    myReservation,
    autoMessageSettings,
    fetchUserProfile,
    fetchLogs,
    fetchAllStylistLogs,
    fetchMyReservations,
    fetchStylistReservations,
    fetchClientReservations,
    fetchMyReservation,
    addLog,
    deleteLog,
    connectUser,
    fetchMyClients,
    updateNextReservation,
    updateUserProfile,
    fetchMyStylists,
    getAvailableSlots,
    makeReservation,
    cancelReservation,
    searchProduct,
    consumeStock,
    fetchInventory,
    saveInventoryItem,
    deleteInventoryItem,
    createCheckoutSession,
    openCustomerPortal,
    debugTogglePro,
    getFinancialStats,
    uploadFile,
    getStylistPublicProfile,
    saveAutoMessageSettings,
    ADMIN_UID,
  };
}
