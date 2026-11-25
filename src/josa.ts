/**
 * Korean particles (조사) after dynamic words: names, document numbers, material codes.
 * The particle depends on whether the word, as it is read aloud, ends in a final consonant
 * (받침): "정희영이", "PO 4500000456과" (육), "TG0011을" (일), "Supplier 3과" (삼).
 */
export type Pair = '이' | '을' | '은' | '와' | '로';
const FORMS: Record<Pair, [string, string]> = { 이: ['이', '가'], 을: ['을', '를'], 은: ['은', '는'], 와: ['과', '와'], 로: ['으로', '로'] };

/** Final sound of a digit as read in Sino-Korean: 영 일 이 삼 사 오 육 칠 팔 구. */
const DIGIT: ('' | 'x' | 'ㄹ')[] = ['x', 'ㄹ', '', 'x', '', '', 'x', 'ㄹ', 'ㄹ', ''];
/** Letter names: 엘 엠 엔 알 end in a consonant. */
const LETTER: Record<string, 'x' | 'ㄹ'> = { l: 'ㄹ', m: 'x', n: 'x', r: 'ㄹ' };

/** '' = no final consonant, 'ㄹ' = final ㄹ, 'x' = any other final consonant. */
function finalOf(word: string): '' | 'x' | 'ㄹ' {
  const m = word.match(/[0-9A-Za-z가-힣](?=[^0-9A-Za-z가-힣]*$)/);
  if (!m) return '';
  const ch = m[0];
  const i = m.index!;
  const code = ch.charCodeAt(0) - 0xac00;
  if (code >= 0 && code < 11172) { const jong = code % 28; return jong === 0 ? '' : jong === 8 ? 'ㄹ' : 'x'; }
  if (/[0-9]/.test(ch)) return DIGIT[Number(ch)];
  const lower = ch.toLowerCase();
  const single = !/[A-Za-z]/.test(word[i - 1] ?? '');
  if (single) return LETTER[lower] ?? '';
  // English word read aloud: ...m / ...n / ...ng end in a consonant, ...l in ㄹ.
  return lower === 'l' ? 'ㄹ' : lower === 'm' || lower === 'n' || lower === 'g' && word[i - 1]?.toLowerCase() === 'n' ? 'x' : '';
}

/** Only the particle: `pc('정희영', '이')` → '이'. */
export function pc(word: string | number | null | undefined, p: Pair): string {
  const f = finalOf(String(word ?? ''));
  if (p === '로') return f === '' || f === 'ㄹ' ? '로' : '으로';
  return FORMS[p][f === '' ? 1 : 0];
}

/** Word + particle: `jo('PO 4500000456', '와')` → 'PO 4500000456과'. */
export const jo = (word: string | number | null | undefined, p: Pair) => `${word ?? ''}${pc(word, p)}`;
