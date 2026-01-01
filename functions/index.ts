import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import {
  onDocumentCreated,
  onDocumentDeleted,
} from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { setGlobalOptions } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import axios from "axios";
import * as line from "@line/bot-sdk";

if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

setGlobalOptions({
  region: "asia-northeast1",
  memory: "1GiB",
  maxInstances: 10,
});

const lineBotToken = defineSecret("LINE_BOT_TOKEN");
const lineBotSecret = defineSecret("LINE_BOT_SECRET");
const lineLoginChannelId = defineSecret("LINE_LOGIN_CHANNEL_ID");
const lineLoginChannelSecret = defineSecret("LINE_LOGIN_CHANNEL_SECRET");
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const yahooAppId = defineSecret("YAHOO_APP_ID");

// --- Helper Functions ---
const sendPushNotification = async (
  uid: string,
  title: string,
  body: string
) => {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    const tokens = userDoc.data()?.fcmTokens || [];
    if (tokens.length > 0) {
      const message = { notification: { title, body }, tokens: tokens };
      await admin.messaging().sendEachForMulticast(message);
    }
  } catch (e) {
    console.error("FCM Error:", e);
  }
};

const sendLineNotification = async (
  uid: string,
  message: string,
  token: string,
  secret: string
) => {
  try {
    const userDoc = await db.collection("users").doc(uid).get();
    const lineUserId = userDoc.data()?.lineUserId;
    if (lineUserId) {
      const client = new line.Client({
        channelAccessToken: token,
        channelSecret: secret,
      });
      await client.pushMessage(lineUserId, { type: "text", text: message });
    }
  } catch (e) {
    console.error("LINE Error:", e);
  }
};

// --- Features ---

// 1. LINE Login
export const linkLineAccount = onCall(
  {
    secrets: [
      lineLoginChannelId,
      lineLoginChannelSecret,
      lineBotToken,
      lineBotSecret,
    ],
  },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");
    const { code, redirectUri } = request.data;
    try {
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", redirectUri);
      params.append("client_id", lineLoginChannelId.value());
      params.append("client_secret", lineLoginChannelSecret.value());

      const tokenResponse = await axios.post(
        "https://api.line.me/oauth2/v2.1/token",
        params
      );
      const { access_token } = tokenResponse.data;
      const profileResponse = await axios.get(
        "https://api.line.me/v2/profile",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      await db.collection("users").doc(request.auth.uid).set(
        {
          isLineLinked: true,
          lineUserId: profileResponse.data.userId,
          lineDisplayName: profileResponse.data.displayName,
        },
        { merge: true }
      );

      return { success: true };
    } catch (error: any) {
      throw new HttpsError("internal", error.message);
    }
  }
);

// 2. AI (Magic Karte) - 自動モデル選択版
export const getAiRecommendation = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");

    const apiKey = geminiApiKey.value();
    const { roughNote } = request.data;

    if (!apiKey)
      return {
        rawText: JSON.stringify({
          technical: "APIキーエラー",
          line: "設定を確認してください",
        }),
      };

    const prompt = `
      美容師のアシスタントAIです。
      以下の【メモ】を元に、JSONデータのみを出力してください。
      挨拶や余計な文章は一切不要です。

      【メモ】
      ${roughNote}

      【出力形式】
      {
          "technical": "美容師向けの専門的なカルテ文章（施術内容、薬剤など）",
          "line": "お客様へ送るサンクスLINEの文章（絵文字を使い、親しみやすく）"
      }
    `;

    try {
      // 1. まず利用可能なモデル一覧を取得する (ListModels)
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listRes = await axios.get(listUrl);
      const models = listRes.data?.models || [];

      // 2. 生成可能なモデルの中から、最新のGeminiを探す
      // 優先順位: 1.5-flash -> 1.5-pro -> 1.0-pro -> 何でもいいからgemini
      let targetModelName = "";

      const generationModels = models.filter((m: any) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      // 優先モデルを探す
      const flash = generationModels.find((m: any) =>
        m.name.includes("gemini-1.5-flash")
      );
      const pro15 = generationModels.find((m: any) =>
        m.name.includes("gemini-1.5-pro")
      );
      const pro10 = generationModels.find((m: any) =>
        m.name.includes("gemini-1.0-pro")
      );
      const anyGemini = generationModels.find((m: any) =>
        m.name.includes("gemini")
      );

      if (flash) targetModelName = flash.name;
      else if (pro15) targetModelName = pro15.name;
      else if (pro10) targetModelName = pro10.name;
      else if (anyGemini) targetModelName = anyGemini.name;
      else if (generationModels.length > 0)
        targetModelName = generationModels[0].name;
      else throw new Error("利用可能なAIモデルが見つかりません");

      // targetModelName は "models/gemini-1.5-flash-001" のような形式で返ってくる
      // URL生成時に models/ が重複しないように調整
      const modelId = targetModelName.replace("models/", "");
      console.log("Selected AI Model:", modelId);

      // 3. 確定したモデルで生成を実行
      const generateUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

      const response = await axios.post(
        generateUrl,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const candidates = response.data?.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No response from AI");
      }

      let text = candidates[0].content.parts[0].text;

      // クリーニング
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      try {
        JSON.parse(text);
      } catch (e) {
        const firstBrace = text.indexOf("{");
        const lastBrace = text.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1) {
          text = text.substring(firstBrace, lastBrace + 1);
        }
      }

      return { rawText: text };
    } catch (e: any) {
      console.error("AI Auto-Detect Error:", e.response?.data || e.message);

      let errorMsg = "AIエラー";
      if (
        e.response?.status === 400 &&
        e.response?.data?.error?.message?.includes("API key not valid")
      ) {
        errorMsg = "APIキーが無効です";
      } else if (e.response?.status === 429) {
        errorMsg = "混雑中: 時間を置いて再試行してください";
      } else if (e.message) {
        errorMsg = "エラー: " + e.message;
      }

      return {
        rawText: JSON.stringify({
          technical: errorMsg,
          line: "（手動で入力してください）",
        }),
      };
    }
  }
);

// 3. 商品検索
export const searchProduct = onCall(
  { secrets: [yahooAppId] },
  async (request) => {
    if (!request.auth)
      throw new HttpsError("unauthenticated", "Login required");
    const { code } = request.data;
    const appId = yahooAppId.value();
    if (!code || !appId) return { name: null };
    try {
      const res = await axios.get(
        `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${appId}&jan_code=${code}&results=1`
      );
      return { name: res.data.hits?.[0]?.name || null };
    } catch (e) {
      return { name: null };
    }
  }
);

// 4. サンクスLINE自動送信
export const sendAutoThanksLine = onDocumentCreated(
  { document: "logs/{logId}", secrets: [lineBotToken, lineBotSecret] },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const logData = snapshot.data();

    const stylistId = logData.stylistId || logData.authorId;
    const customerId = logData.customerId;
    const customLineMessage = logData.customLineMessage;

    if (!stylistId || !customerId) {
      return;
    }

    try {
      const settingsRef = db
        .collection("users")
        .doc(stylistId)
        .collection("system")
        .doc("auto_messages");
      const settingsSnap = await settingsRef.get();
      const settings = settingsSnap.exists
        ? settingsSnap.data()
        : { enabled: true };

      if (settings?.enabled === false) {
        return;
      }

      const customerRef = await db.collection("users").doc(customerId).get();
      const lineUserId = customerRef.data()?.lineUserId;
      const customerName = customerRef.data()?.name || "お客様";

      if (!lineUserId) {
        return;
      }

      const template =
        settings?.template ||
        "{name}様\n\n本日はご来店ありがとうございました！";
      const msg =
        customLineMessage || template.replace(/\{name\}/g, customerName);

      const token = lineBotToken.value();
      const secret = lineBotSecret.value();

      if (!token) return;

      const client = new line.Client({
        channelAccessToken: token,
        channelSecret: secret,
      });
      await client.pushMessage(lineUserId, { type: "text", text: msg });
    } catch (e) {
      console.error("[ThanksLine] Error", e);
    }
  }
);

// 5. LINE Webhook
export const lineWebhook = onRequest(
  { secrets: [lineBotToken, lineBotSecret] },
  async (req, res) => {
    res.json({ success: true });
  }
);

// 6. 予約作成通知
export const notifyOnReservationCreated = onDocumentCreated(
  {
    document: "reservations/{reservationId}",
    secrets: [lineBotToken, lineBotSecret],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const { stylistId, customerId, customerName, date, time, createdBy } = data;

    const token = lineBotToken.value();
    const secret = lineBotSecret.value();
    const msg = `【予約完了】\n${customerName}様\n📅 ${date} ${time}`;

    if (createdBy === customerId) {
      await sendPushNotification(stylistId, "新着予約", msg);
      await sendLineNotification(stylistId, msg, token, secret);
    } else if (createdBy === stylistId) {
      await sendPushNotification(customerId, "予約のお知らせ", msg);
      await sendLineNotification(customerId, msg, token, secret);
    } else {
      await sendPushNotification(stylistId, "新着予約", msg);
      await sendPushNotification(customerId, "予約のお知らせ", msg);
    }

    try {
      const connectionsRef = db.collection("connections");
      const querySnapshot = await connectionsRef
        .where("stylistId", "==", stylistId)
        .where("customerId", "==", customerId)
        .get();
      if (!querySnapshot.empty) {
        const batch = db.batch();
        querySnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, { nextReservation: date });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Next reservation error", e);
    }
  }
);

// 7. 予約キャンセル通知
export const notifyOnReservationDeleted = onDocumentDeleted(
  {
    document: "reservations/{reservationId}",
    secrets: [lineBotToken, lineBotSecret],
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;
    const data = snapshot.data();
    const { stylistId, customerId, customerName, date, time } = data;
    const token = lineBotToken.value();
    const secret = lineBotSecret.value();
    const msg = `【予約キャンセル】\n${customerName}様\n📅 ${date} ${time}\n予約が取り消されました。`;

    await sendPushNotification(stylistId, "予約キャンセル", msg);
    await sendLineNotification(stylistId, msg, token, secret);
    await sendPushNotification(customerId, "予約キャンセル", msg);
    await sendLineNotification(customerId, msg, token, secret);
  }
);

// 8. リマインダー通知
export const sendDailyReminders = onSchedule(
  "every day 09:00",
  async (event) => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split("T")[0];
    const snapshot = await db
      .collection("reservations")
      .where("date", "==", tomorrowStr)
      .get();
    if (snapshot.empty) return;

    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const msg = `【リマインダー】\n明日 ${data.time} よりご予約がございます。\nお待ちしております！`;
      await sendPushNotification(data.customerId, "ご予約のリマインダー", msg);
    });
  }
);
