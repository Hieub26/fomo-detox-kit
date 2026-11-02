import { scoreOf } from '../quiz/scoring';
import { GROUPS_KEYS, LEGACY_KEY, Sync, items, type GroupItems, type GroupKey } from './sync';
import { toast, uid } from '../../lib/dom';
import { save } from '../../state/store';
import type { Assessment, AudioSession, Post, Program } from '../../types';

type Raw = Record<string, unknown>;
const isRaw = (x: unknown): x is Raw => typeof x === 'object' && x !== null && !Array.isArray(x);
const isDay = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00').getTime());
const isStamp = (s: unknown): s is string => typeof s === 'string' && !isNaN(new Date(s).getTime());
const isAnswers = (x: unknown): x is number[] => Array.isArray(x) && x.length === 10 && x.every(v => [1, 2, 3, 4].includes(v));
const isDays = (x: unknown): x is number => x === 7 || x === 14 || x === 21;
const isStatus = (x: unknown): x is Program['status'] => x === 'active' || x === 'done' || x === 'stopped';
const isSeconds = (x: unknown): x is number => typeof x === 'number' && Number.isInteger(x) && x >= 0 && x <= 86400;
const list = (x: unknown): Raw[] => (Array.isArray(x) ? x.filter(isRaw) : []);
const validId = (id: unknown) => (typeof id === 'string' && id.length >= 1 && id.length <= 40 ? id : uid());
const strOrNull = (x: unknown) => (typeof x === 'string' ? x : null);

// File sao lưu có thể bị sửa tay. Chỉ giữ dòng hợp lệ để một dòng hỏng không chặn cả đợt đồng bộ.
export function sanitizeData(d: unknown) {
  const src = isRaw(d) ? d : {};
  return {
    assessments: list(src.assessments).flatMap((a): Assessment[] => (isStamp(a.date) && isAnswers(a.answers)
      ? [{ id: validId(a.id), date: new Date(a.date).toISOString(), answers: a.answers, score: scoreOf(a.answers), kind: a.kind === 'sau' ? 'sau' : 'thường', programId: strOrNull(a.programId) }]
      : [])),
    programs: list(src.programs).flatMap((p): Program[] => (isDays(p.days) && isDay(p.start) && isRaw(p.checks)
      ? [{ id: validId(p.id), days: p.days, start: p.start, checks: p.checks as Program['checks'], status: isStatus(p.status) ? p.status : 'stopped', preId: strOrNull(p.preId), postId: strOrNull(p.postId) }]
      : [])),
    audio: list(src.audio).flatMap((a): AudioSession[] => (isStamp(a.date) && isSeconds(a.seconds) && typeof a.sound === 'string' && a.sound.length <= 20
      ? [{ id: validId(a.id), date: new Date(a.date).toISOString(), sound: a.sound, seconds: a.seconds }]
      : [])),
    posts: list(src.posts).flatMap((p): Post[] => (isDay(p.date) && typeof p.text === 'string' && p.text.length >= 1 && p.text.length <= 1500
      ? [{ id: validId(p.id), date: p.date, text: p.text }]
      : []))
  };
}
function addMissing<K extends GroupKey>(k: K, incoming: GroupItems[K][]) {
  const have = new Set(items(k).map(x => x.id));
  incoming.forEach(x => { if (!have.has(x.id)) items(k).push(x); });
}
export function offerLegacyImport() {
  const skipKey = 'fomo_legacy_skip_' + Sync.uid;
  let raw = null;
  try { raw = localStorage.getItem(LEGACY_KEY); if (localStorage.getItem(skipKey)) return; } catch (e) { return; }
  if (!raw) return;
  let d;
  try { d = sanitizeData(JSON.parse(raw)); } catch (e) { return; }
  const n = d.assessments.length + d.programs.length + d.posts.length;
  if (!n) return;
  if (!confirm(`Trên máy này có dữ liệu cũ chưa gắn tài khoản (${d.assessments.length} lần trắc nghiệm, ${d.programs.length} lộ trình). Đưa vào tài khoản này?\n\nChỉ chọn OK nếu đó là dữ liệu của bạn. Chọn Cancel nếu máy dùng chung.`)) {
    try { localStorage.setItem(skipKey, '1'); } catch (e) { /* bỏ qua */ }
    return;
  }
  GROUPS_KEYS.forEach(k => addMissing(k, d[k]));
  try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* bỏ qua */ }
  save();
  toast('Đã đưa dữ liệu cũ vào tài khoản.');
}
