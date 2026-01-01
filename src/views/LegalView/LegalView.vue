<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-stone-50 p-6 text-stone-800 font-sans pb-20">
    <div
      class="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-100"
    >
      <!-- ヘッダー & 戻るボタン -->
      <div class="flex items-center gap-4 mb-8">
        <button
          @click="router.back()"
          class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition"
        >
          ←
        </button>
        <h1 class="text-lg font-bold">特定商取引法に基づく表記</h1>
      </div>

      <div class="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">販売業者</h2>
          <p>吉岡 拓海</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">代表責任者</h2>
          <p>吉岡 拓海</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">所在地</h2>
          <!-- ★重要: 免許証等の記載通り、番地・建物名・部屋番号まで正確に記載してください -->
          <p>
            〒815-0041<br />福岡県福岡市南区野間1丁目 19-1 Cherim高宮Ⅱwest 201
          </p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">電話番号</h2>
          <p>080-6423-6435</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">メールアドレス</h2>
          <p>gongedonghuam@gmail.com</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">販売価格</h2>
          <p>
            各プランの申し込みページに表示された金額（表示価格/消費税込）とします。
          </p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">
            商品代金以外の必要料金
          </h2>
          <p>
            なし（インターネット接続料金その他の電気通信回線の通信に関する費用はお客様の負担となります）
          </p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">支払方法</h2>
          <p>クレジットカード決済（Stripe）</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">支払時期</h2>
          <ul class="list-disc list-inside pl-1 space-y-1">
            <li>初回: 申し込み完了時にお支払いが確定します。</li>
            <li>2回目以降: 初回決済日の1ヶ月後に自動的に決済が行われます。</li>
          </ul>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">商品の引渡時期</h2>
          <p>決済完了後、直ちにご利用いただけます。</p>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">
            返品・交換・キャンセルについて
          </h2>
          <ul class="list-disc list-inside pl-1 space-y-1">
            <li>
              返品・交換:
              デジタルコンテンツの性質上、返品・交換はお受けできません。
            </li>
            <li>
              解約:
              設定画面の「サブスクリプション管理」より、いつでも解約手続きが可能です。解約手続き完了後、次回の請求日より課金が停止されます。日割り計算による返金は行われません。
            </li>
          </ul>
        </section>

        <section>
          <h2 class="font-bold text-stone-400 text-xs mb-1">動作環境</h2>
          <ul class="list-disc list-inside pl-1 space-y-1">
            <li>iOS 15.0以降 (Safari最新版)</li>
            <li>Android 10.0以降 (Chrome最新版)</li>
            <li>推奨ブラウザ: Google Chrome, Safari</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
``` ### 修正後の手順 1. 上記のコードで `LegalView.vue` を上書きする。 2.
`[ここに番地・建物名を記入]`
の部分を、**Stripeに提出した身分証明書と一言一句同じ住所** に書き換える。 3.
再度デプロイする。 ```bash npm run build firebase deploy
