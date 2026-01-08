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
exports.notifyOnMockExamReleased = exports.deleteInactiveUsers = exports.notifyOnMockExamCreated = void 0;
const firestore_1 = require("firebase-functions/v2/firestore"); // ★onDocumentUpdatedを追加
const v2_1 = require("firebase-functions/v2");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const ADMIN_UIDS = ["SyfPBfS5D3VMktj2cEzXCxI1dbv1"];
(0, v2_1.setGlobalOptions)({ region: "asia-northeast1" });
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * 1. 模試作成時の通知 (既存機能)
 */
exports.notifyOnMockExamCreated = (0, firestore_1.onDocumentCreated)("mock_exams/{examId}", async (event) => {
    // ... (中身はそのまま) ...
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
    // トークン取得と送信処理（既存のまま）
    const usersSnap = await admin.firestore().collection("users").get();
    let tokens = [];
    usersSnap.forEach((doc) => {
        const userData = doc.data();
        if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
            tokens.push(...userData.fcmTokens);
        }
    });
    tokens = [...new Set(tokens)];
    if (tokens.length === 0)
        return;
    try {
        await admin.messaging().sendEachForMulticast({
            tokens: tokens,
            notification: message.notification,
            webpush: message.webpush,
        });
    }
    catch (error) {
        console.error("通知送信エラー:", error);
    }
});
/**
 * 2. 休眠ユーザー自動削除 (既存機能)
 */
exports.deleteInactiveUsers = (0, scheduler_1.onSchedule)(
// ... (中身はそのまま) ...
{ schedule: "every day 00:00", timeoutSeconds: 540 }, async (event) => {
    // ... (省略) ...
});
/**
 * ★★★ 3. 模試結果公開時の通知 (新規追加) ★★★
 * ステータスが "released" に変わった瞬間に通知を送る
 */
exports.notifyOnMockExamReleased = (0, firestore_1.onDocumentUpdated)("mock_exams/{examId}", async (event) => {
    var _a, _b;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    // ステータスが「released」に変わった時だけ実行
    if ((before === null || before === void 0 ? void 0 : before.status) !== "released" && (after === null || after === void 0 ? void 0 : after.status) === "released") {
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
            console.log(`結果公開通知完了: 成功 ${response.successCount} 件`);
        }
        catch (error) {
            console.error("結果公開通知エラー:", error);
        }
    }
});
