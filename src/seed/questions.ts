import { Question } from "@/types"; // さっき作った型定義

export const SAMPLE_QUESTIONS: Omit<Question, "id">[] = [
  {
    examYear: "第113回",
    questionNumber: "午前1",
    type: "mandatory", // 必修
    text: "成人の正常な安静時呼吸数はどれか。",
    choices: ["12〜20回/分", "25〜35回/分", "40〜50回/分", "55〜65回/分"],
    correctIndices: [0], // アが正解
    explanation:
      "成人の安静時呼吸数は約12〜20回/分です。25回以上は頻呼吸、12回未満は徐呼吸とされます。",
    tags: ["必修", "基礎看護学", "バイタルサイン"],
  },
  {
    examYear: "第113回",
    questionNumber: "午前2",
    type: "mandatory",
    text: "インスリンが分泌される臓器はどれか。",
    choices: ["肝臓", "胆囊", "膵臓", "腎臓"],
    correctIndices: [2], // ウが正解
    explanation:
      "インスリンは膵臓のランゲルハンス島β細胞から分泌され、血糖値を下げる唯一のホルモンです。",
    tags: ["必修", "解剖生理", "ホルモン"],
  },
  {
    examYear: "第113回",
    questionNumber: "午後15",
    type: "general", // 一般
    text: "狭心症の発作時に使用される薬剤はどれか。",
    choices: ["ジゴキシン", "ニトログリセリン", "アドレナリン", "アトロピン"],
    correctIndices: [1],
    explanation:
      "狭心症発作時にはニトログリセリンの舌下投与が行われます。血管拡張作用により心負荷を軽減します。",
    tags: ["一般", "薬理学", "循環器"],
  },
  {
    examYear: "第112回",
    questionNumber: "午前5",
    type: "situation", // 状況設定
    text: "Aさん（80歳、女性）は脳梗塞の後遺症で右片麻痺がある。食事介助で適切なのはどれか。",
    choices: [
      "水分はとろみをつけずに提供する",
      "一口量は多めにする",
      "麻痺側から介助する",
      "健側を下にした側臥位をとる",
    ],
    correctIndices: [3],
    explanation:
      "誤嚥を防ぐため、健側（麻痺がない側）を下にして、重力を利用して健側へ食物を流し込みます。",
    tags: ["状況設定", "老年看護学", "食事援助"],
  },
];
