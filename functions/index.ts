import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore"; // ★onDocumentUpdatedを追加
import { setGlobalOptions } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];

setGlobalOptions({ region: "asia-northeast1" });

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * 1. 模試作成時の通知 (既存機能)
 */
export const notifyOnMockExamCreated = onDocumentCreated(
  "mock_exams/{examId}",
  async (event) => {
    // ... (中身はそのまま) ...
    const snapshot = event.data;
    if (!snapshot) return;

    const examData = snapshot.data();
    const title = examData.title || "新しい模試";

    const message = {
      notification: {
        title: "📢 全国統一模試が公開されました！",
        body: `「${title}」の受付が開始されました。今すぐ実力をチェックしましょう！`,
      },
      webpush: {
        fcmOptions: {
          link: "/mock-exam",
        },
      },
    };

    // トークン取得と送信処理（既存のまま）
    const usersSnap = await admin.firestore().collection("users").get();
    let tokens: string[] = [];
    usersSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    });
    tokens = [...new Set(tokens)];
    if (tokens.length === 0) return;

    try {
      await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        notification: message.notification,
        webpush: message.webpush,
      });
    } catch (error) {
      console.error("通知送信エラー:", error);
    }
  }
);

/**
 * 2. 休眠ユーザー自動削除 (既存機能)
 */
export const deleteInactiveUsers = onSchedule(
  // ... (中身はそのまま) ...
  { schedule: "every day 00:00", timeoutSeconds: 540 },
  async (event) => {
    // ... (省略) ...
  }
);

/**
 * ★★★ 3. 模試結果公開時の通知 (新規追加) ★★★
 * ステータスが "released" に変わった瞬間に通知を送る
 */
export const notifyOnMockExamReleased = onDocumentUpdated(
  "mock_exams/{examId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    // ステータスが「released」に変わった時だけ実行
    if (before?.status !== "released" && after?.status === "released") {
      const title = after.title || "全国統一模試";

      const message = {
        notification: {
          title: "📊 模試の結果が公開されました！",
          body: `「${title}」の集計が完了しました。あなたの順位と判定をチェックしましょう！`,
        },
        webpush: {
          fcmOptions: {
            link: "/mock-exam", // タップで模試画面へ
          },
        },
      };

      // 全ユーザーに通知送信
      const usersSnap = await admin.firestore().collection("users").get();
      let tokens: string[] = [];

      usersSnap.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      });

      tokens = [...new Set(tokens)];

      if (tokens.length === 0) {
        console.log("送信先トークンがありません。");
        return;
      }

      try {
        const response = await admin.messaging().sendEachForMulticast({
          tokens: tokens,
          notification: message.notification,
          webpush: message.webpush,
        });
        console.log(`結果公開通知完了: 成功 ${response.successCount} 件`);
      } catch (error) {
        console.error("結果公開通知エラー:", error);
      }
    }
  }
);
