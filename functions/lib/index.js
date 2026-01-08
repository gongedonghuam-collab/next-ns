"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInactiveUsers = exports.notifyOnMockExamCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const v2_1 = require("firebase-functions/v2");
const scheduler_1 = require("firebase-functions/v2/scheduler"); // ★追加
const admin = __importStar(require("firebase-admin"));
// ★重要: ここに削除したくない管理者のUIDを設定してください
// (src/router/index.ts にある ADMIN_UIDS と同じものを入れてください)
const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];
(0, v2_1.setGlobalOptions)({ region: "asia-northeast1" });
admin.initializeApp();
/**
 * 1. 模試作成時の通知 (既存機能)
 */
exports.notifyOnMockExamCreated = (0, firestore_1.onDocumentCreated)("mock_exams/{examId}", async (event) => {
    const snapshot = event.data;
    if (!snapshot)
        return;
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
    let tokens = [];
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
        console.log(`通知送信完了: 成功 ${response.successCount} 件 / 失敗 ${response.failureCount} 件`);
    }
    catch (error) {
        console.error("通知送信エラー:", error);
    }
});
/**
 * 2. 休眠ユーザー自動削除 (新機能)
 * 毎日深夜0時に実行し、作成から1年以上経過かつ管理者でないユーザーを削除
 */
exports.deleteInactiveUsers = (0, scheduler_1.onSchedule)({ schedule: "every day 00:00", timeoutSeconds: 540 }, async (event) => {
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    console.log(`[AutoDelete] ${oneYearAgo.toISOString()} 以前のユーザーを検索...`);
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
            }
            catch (err) {
                console.error(`[Delete Error] User: ${uid}`, err);
            }
        });
        await Promise.all(deletePromises);
        console.log("[AutoDelete] 処理完了");
    }
    catch (error) {
        console.error("[AutoDelete] 全体エラー:", error);
    }
});
