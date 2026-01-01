<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-stone-50 p-6 text-stone-800 font-sans pb-24">
    <div
      class="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-100"
    >
      <div class="flex items-center gap-4 mb-8">
        <button
          @click="router.back()"
          class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition"
        >
          ←
        </button>
        <h1 class="text-xl font-bold">利用規約</h1>
      </div>

      <div class="space-y-6 text-sm leading-relaxed text-stone-600">
        <section>
          <h2 class="font-bold text-stone-800 mb-2">第1条（知的財産権）</h2>
          <p>
            本アプリ「HairLink」に含まれるすべてのコンテンツ（文章、画像、プログラムコード、デザイン、ロゴ等）の著作権、商標権、その他の知的財産権は、開発者（吉岡
            拓海）に帰属します。利用者は、これらを無断で複製、転用、改変することはできません。
          </p>
        </section>

        <section>
          <h2 class="font-bold text-stone-800 mb-2">第2条（禁止事項）</h2>
          <p>利用者は、以下の行為を行ってはなりません。</p>
          <ul class="list-disc list-inside pl-2 space-y-1">
            <li>
              本アプリのソースコードを解析、リバースエンジニアリングする行為
            </li>
            <li>
              本アプリと類似のサービスを作成するために、本アプリの仕様やデザインを模倣する行為
            </li>
            <li>
              不正な手段でアクセスしたり、サーバーに過度な負荷をかける行為
            </li>
            <li>アカウントを第三者に譲渡または貸与する行為</li>
          </ul>
        </section>

        <section>
          <h2 class="font-bold text-stone-800 mb-2">第3条（免責事項）</h2>
          <p>
            本アプリの使用により生じた損害（データの消失、業務の停止など）について、運営者は一切の責任を負いません。本アプリは現状有姿で提供されるものとします。
          </p>
        </section>

        <section>
          <h2 class="font-bold text-stone-800 mb-2">
            第4条（サービスの変更・停止）
          </h2>
          <p>
            運営者は、事前の通知なく本アプリの機能を変更、または提供を停止することができるものとします。
          </p>
        </section>

        <p class="mt-8 text-xs text-stone-400">2025年12月20日 制定</p>
      </div>
    </div>
  </div>
</template>
