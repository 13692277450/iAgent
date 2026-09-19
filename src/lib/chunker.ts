// lib/chunker.ts

export type ChunkOptions = {
  maxSize?: number;    // 每块最大字符数
  overlap?: number;    // 相邻块的重叠字符数
  minSize?: number;    // 小于这个长度的块会被丢弃
};

/**
 * 把长文本切成适合向量化的块。
 * 优先按段落边界切分，段落过长时才按字符硬切。
 */
export function splitChunks(
  text: string,
  { maxSize = 800, overlap = 100, minSize = 20 }: ChunkOptions = {},
): string[] {
  // 1. 归一化空白，按空行拆成段落
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  const flush = () => {
    const trimmed = buffer.trim();
    if (trimmed.length >= minSize) chunks.push(trimmed);
    buffer = "";
  };

  for (const para of paragraphs) {
    // 段落本身超长 → 先冲刷 buffer，再按字符硬切
    if (para.length > maxSize) {
      flush();
      for (const piece of hardSplit(para, maxSize, overlap)) {
        chunks.push(piece);
      }
      continue;
    }

    // 加进 buffer 后没超限 → 继续累积
    if ((buffer + "\n\n" + para).length <= maxSize) {
      buffer = buffer ? buffer + "\n\n" + para : para;
    } else {
      // 超限 → 冲刷当前 buffer，新段落另起
      flush();
      buffer = para;
    }
  }
  flush();

  return chunks;
}

/** 按固定长度硬切，带 overlap */
function hardSplit(text: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    out.push(text.slice(start, end));
    if (end === text.length) break;
    start = end - overlap;
  }
  return out;
}