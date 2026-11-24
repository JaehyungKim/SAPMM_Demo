/**
 * Interview analysis for the admin page – runs entirely in the browser (the customer's
 * interview never leaves the machine). Reads plain text / Markdown / CSV and Office files
 * (.docx · .pptx · .xlsx, via a tiny ZIP reader), then scores every scope item of the catalog
 * by its keywords and keeps the sentences that matched as evidence.
 */
import { ALL_ITEMS, type CatalogItem } from '../../scenarios/catalog';

/* ------------------------------------------------------------------ file → text */

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate-raw');
  const buf = await new Response(new Blob([data as BlobPart]).stream().pipeThrough(ds)).arrayBuffer();
  return new Uint8Array(buf);
}

/** Minimal ZIP reader: returns the entries whose name matches `want`. */
async function unzip(buf: ArrayBuffer, want: (name: string) => boolean): Promise<{ name: string; text: string }[]> {
  const v = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('ZIP 형식이 아닙니다');
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const out: { name: string; text: string }[] = [];
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true);
    const nlen = v.getUint16(p + 28, true), elen = v.getUint16(p + 30, true), clen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    if (!want(name)) continue;
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const raw = u8.subarray(start, start + csize);
    const data = method === 8 ? await inflateRaw(raw) : raw;
    out.push({ name, text: dec.decode(data) });
  }
  return out;
}

const xmlText = (xml: string, para: RegExp) => xml
  .replace(para, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** Extracts plain text from an uploaded file. PDF is not supported (paste the text instead). */
export async function fileToText(f: File): Promise<string> {
  const ext = f.name.toLowerCase().split('.').pop() ?? '';
  if (['txt', 'md', 'csv', 'tsv', 'json', 'log'].includes(ext)) return f.text();
  const buf = await f.arrayBuffer();
  if (ext === 'docx') {
    const parts = await unzip(buf, (n) => /^word\/(document|header\d*|footer\d*)\.xml$/.test(n));
    return parts.map((x) => xmlText(x.text, /<\/w:p>|<w:br\/>|<w:tab\/>/g)).join('\n');
  }
  if (ext === 'pptx') {
    const parts = await unzip(buf, (n) => /^ppt\/(slides\/slide\d+|notesSlides\/notesSlide\d+)\.xml$/.test(n));
    return parts.map((x) => xmlText(x.text, /<\/a:p>/g)).join('\n');
  }
  if (ext === 'xlsx') {
    const parts = await unzip(buf, (n) => n === 'xl/sharedStrings.xml');
    return parts.map((x) => xmlText(x.text, /<\/si>/g)).join('\n');
  }
  if (ext === 'pdf') throw new Error('PDF는 브라우저에서 텍스트를 추출할 수 없습니다. PDF 내용을 복사해 아래 입력란에 붙여 넣어 주세요.');
  throw new Error(`지원하지 않는 형식입니다 (.${ext}). txt · md · csv · docx · pptx · xlsx 를 올리거나 내용을 붙여 넣어 주세요.`);
}

/* ------------------------------------------------------------------ scoring */

export interface Evidence { line: string; kws: string[]; negative: boolean }
export interface Match { item: CatalogItem & { group: { id: string; title: string; titleKo: string } }; score: number; hits: Record<string, number>; evidence: Evidence[] }

/** Sentences like "…은 필요 없음 / 사용하지 않음" count against the scope item. */
const NEGATION = /(필요\s*없|필요하지\s*않|불필요|사용하지\s*않|쓰지\s*않|하지\s*않음|해당\s*없|계획\s*없|미사용|not\s+needed|no\s+need|not\s+required|out\s+of\s+scope|범위\s*외|제외)/i;

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** ASCII keywords match as whole words (MRP, ASN …); Korean keywords as substrings. */
const kwRegex = (kw: string) => (/^[\x20-\x7e]+$/.test(kw) ? new RegExp(`(?<![A-Za-z0-9])${esc(kw)}(?![A-Za-z0-9])`, 'gi') : new RegExp(esc(kw), 'gi'));
/** Specific keywords (multi-word or ≥ 4 letters) weigh 2, short generic ones 1. */
const weight = (kw: string) => (kw.includes(' ') || kw.replace(/\s/g, '').length >= 4 ? 2 : 1);

export function analyze(text: string): Match[] {
  const lines = text.split(/\n|(?<=[.!?。])\s+/).map((l) => l.trim()).filter(Boolean);
  const res: Match[] = [];
  for (const item of ALL_ITEMS) {
    const hits: Record<string, number> = {};
    const evidence: Evidence[] = [];
    let score = 0;
    const res2 = item.kw.map((kw) => ({ kw, re: kwRegex(kw) }));
    for (const line of lines) {
      const found = res2.filter((k) => { k.re.lastIndex = 0; return k.re.test(line); }).map((k) => k.kw);
      if (!found.length) continue;
      const negative = NEGATION.test(line);
      // Count each keyword at most 3 times overall so one repeated word does not dominate.
      found.forEach((kw) => {
        hits[kw] = (hits[kw] ?? 0) + 1;
        if (hits[kw] <= 3) score += negative ? -weight(kw) : weight(kw);
      });
      if (evidence.length < 4) evidence.push({ line: line.length > 220 ? `${line.slice(0, 220)}…` : line, kws: found, negative });
    }
    if (Object.keys(hits).length) res.push({ item, score, hits, evidence });
  }
  return res.sort((a, b) => b.score - a.score);
}

export const level = (score: number) => (score >= 6 ? { t: '강력 추천', c: 'hi' } : score >= 3 ? { t: '추천', c: 'mid' } : score > 0 ? { t: '참고', c: 'lo' } : { t: '제외 언급', c: 'neg' });

/** Splits a line into plain and highlighted parts for the evidence view. */
export function highlight(line: string, kws: string[]): { t: string; hit: boolean }[] {
  if (!kws.length) return [{ t: line, hit: false }];
  const re = new RegExp(`(${kws.map(esc).sort((a, b) => b.length - a.length).join('|')})`, 'gi');
  return line.split(re).filter(Boolean).map((t) => ({ t, hit: kws.some((k) => k.toLowerCase() === t.toLowerCase()) }));
}
