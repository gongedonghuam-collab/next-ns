import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { onSchedule } from "firebase-functions/v2/scheduler"; // ★追加
import * as admin from "firebase-admin";

// ★重要: ここに削除したくない管理者のUIDを設定してください
// (src/router/index.ts にある ADMIN_UIDS と同じものを入れてください)
const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];

setGlobalOptions({ region: "asia-northeast1" });

admin.initializeApp();

/**
 * 1. 模試作成時の通知 (既存機能)
 */
export const notifyOnMockExamCreated = onDocumentCreated(
  "mock_exams/{examId}",
  async (event) => {
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
      console.log(
        `通知送信完了: 成功 ${response.successCount} 件 / 失敗 ${response.failureCount} 件`
      );
    } catch (error) {
      console.error("通知送信エラー:", error);
    }
  }
);

/**
 * 2. 休眠ユーザー自動削除 (新機能)
 * 毎日深夜0時に実行し、作成から1年以上経過かつ管理者でないユーザーを削除
 */
export const deleteInactiveUsers = onSchedule(
  { schedule: "every day 00:00", timeoutSeconds: 540 },
  async (event) => {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    console.log(
      `[AutoDelete] ${oneYearAgo.toISOString()} 以前のユーザーを検索...`
    );

    try {
      // 1. 対象ユーザーを検索
      const usersRef = admin.firestore().collection("users");
      const snapshot = await usersRef
        .where("createdAt", "<=", oneYearAgo)
        .get();

      if (snapshot.empty) {
        console.log("[AutoDelete] 対象ユーザーはいませんでした。");
        return;
      }

      console.log(`[AutoDelete] ${snapshot.size} 件の候補が見つかりました。`);

      // 2. 一人ずつチェックして削除
      const deletePromises = snapshot.docs.map(async (doc) => {
        const uid = doc.id;

        // ★★★ ガード処理: 管理者ならスキップ ★★★
        if (ADMIN_UIDS.includes(uid)) {
          console.log(`[Skip] 管理者アカウントのため削除しません: ${uid}`);
          return;
        }

        try {
          // Authentication (ログイン情報) を削除
          await admin.auth().deleteUser(uid);
          // Firestore (ユーザーデータ) を削除
          await doc.ref.delete();

          console.log(`[Deleted] User: ${uid}`);
        } catch (err) {
          console.error(`[Delete Error] User: ${uid}`, err);
        }
      });

      await Promise.all(deletePromises);
      console.log("[AutoDelete] 処理完了");
    } catch (error) {
      console.error("[AutoDelete] 全体エラー:", error);
    }
  }
);
