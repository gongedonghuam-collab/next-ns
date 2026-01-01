// ---------------------------------------------------------
// 機能C: CSV出力ロジック
// ---------------------------------------------------------
export const downloadSalesCsv = (data: any[], fileName = "sales_data.csv") => {
  if (!data || data.length === 0) return;

  // ヘッダー作成 (データのキーを使用)
  const headers = Object.keys(data[0]).join(",");

  // データ行作成
  const rows = data
    .map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(",")
    )
    .join("\n");

  const csvContent = `${headers}\n${rows}`;

  // BOM付与 (Excel文字化け対策)
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
  const blob = new Blob([bom, csvContent], { type: "text/csv" });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ---------------------------------------------------------
// 機能F: Canvas動画生成ロジック (簡易スライドショー)
// ---------------------------------------------------------
export class VideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor(width = 1080, height = 1920) {
    // リール用縦長サイズ
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
  }

  // 画像URLのリストを受け取り、WebM動画Blobを返す
  async createSlideshow(imageUrls: string[]): Promise<Blob> {
    const stream = this.canvas.captureStream(30); // 30fps
    this.mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.mediaRecorder.start();

    // 画像をロードして描画
    for (const url of imageUrls) {
      await this.drawImageWithTransition(url, 3000); // 各画像3秒表示
    }

    this.mediaRecorder.stop();

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: "video/webm" });
        this.chunks = []; // Reset
        resolve(blob);
      };
    });
  }

  private async drawImageWithTransition(url: string, durationMs: number) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((r) => (img.onload = r));

    const startTime = performance.now();

    return new Promise<void>((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        if (elapsed > durationMs) {
          resolve();
          return;
        }

        // シンプルな描画（将来的にはフェードインなどを実装可能）
        this.ctx.fillStyle = "#000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // アスペクト比維持で中央描画
        const scale = Math.max(
          this.canvas.width / img.width,
          this.canvas.height / img.height
        );
        const x = (this.canvas.width - img.width * scale) / 2;
        const y = (this.canvas.height - img.height * scale) / 2;

        this.ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        // テキストオーバーレイ
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 40px sans-serif";
        this.ctx.fillText("HairLink Premium Movie", 50, 100);

        requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
  }
}
