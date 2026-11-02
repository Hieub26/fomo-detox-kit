import { DEFAULT_CARDS, DEFAULT_SITUATIONS, type HandbookCard, type Situation } from './content';
import { sb } from '../../lib/supabase';

const KEY = 'fomo_handbook';
function cached(): { cards: HandbookCard[]; situations: Situation[] } | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
const init = cached();
export let CARDS: HandbookCard[] = init?.cards || DEFAULT_CARDS;
export let SITUATIONS: Situation[] = init?.situations || DEFAULT_SITUATIONS;

export function setHandbook(cards: HandbookCard[], situations: Situation[]) {
  CARDS = cards; SITUATIONS = situations;
  try { localStorage.setItem(KEY, JSON.stringify({ cards, situations })); } catch (e) { /* bỏ qua */ }
}
// Trả về true nếu nội dung khác bản đang dùng.
export async function loadHandbook() {
  const [c, s] = await Promise.all([
    sb.from('handbook_cards').select('title,body,callout').order('pos'),
    sb.from('handbook_situations').select('title,reaction,solution').order('pos')
  ]);
  if (c.error || s.error || !c.data || !s.data || !c.data.length || !s.data.length) return false;
  const changed = JSON.stringify({ cards: c.data, situations: s.data }) !== JSON.stringify({ cards: CARDS, situations: SITUATIONS });
  if (changed) setHandbook(c.data, s.data);
  return changed;
}
