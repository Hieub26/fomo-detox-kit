import { items, type Item } from './sync';
import { scoreOf } from '../quiz/scoring';
import { GROUPS_KEYS, LEGACY_KEY, Sync } from './sync';
import { toast, uid } from '../../lib/dom';
import { save } from '../../state/store';

// File sao lưu có thể bị sửa tay. Chỉ giữ dòng hợp lệ để một dòng hỏng không chặn cả đợt đồng bộ.
export function sanitizeData(d: any) {
  const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00').getTime());
  const validId = (id: unknown) => (typeof id === 'string' && id.length >= 1 && id.length <= 40 ? id : uid());
  const list = (x: unknown): any[] => (Array.isArray(x) ? x : []);
  const validStamp = (s: unknown) => typeof s === 'string' && !isNaN(new Date(s).getTime());
  return {
    assessments: list(d.assessments)
      .filter(a => a && validStamp(a.date) && Array.isArray(a.answers) && a.answers.length === 10 && a.answers.every((v: number) => [1, 2, 3, 4].includes(v)))
      .map(a => ({ id: validId(a.id), date: new Date(a.date).toISOString(), answers: a.answers, score: scoreOf(a.answers), kind: a.kind === 'sau' ? 'sau' : 'thường', programId: typeof a.programId === 'string' ? a.programId : null })),
    programs: list(d.programs)
      .filter(p => p && [7, 14, 21].includes(p.days) && validDay(p.start) && p.checks && typeof p.checks === 'object' && !Array.isArray(p.checks))
      .map(p => ({ id: validId(p.id), days: p.days, start: p.start, checks: p.checks, status: ['active', 'done', 'stopped'].includes(p.status) ? p.status : 'stopped', preId: typeof p.preId === 'string' ? p.preId : null, postId: typeof p.postId === 'string' ? p.postId : null })),
    audio: list(d.audio)
      .filter(a => a && validStamp(a.date) && Number.isInteger(a.seconds) && a.seconds >= 0 && a.seconds <= 86400 && typeof a.sound === 'string' && a.sound.length <= 20)
      .map(a => ({ id: validId(a.id), date: new Date(a.date).toISOString(), sound: a.sound, seconds: a.seconds })),
    posts: list(d.posts)
      .filter(p => p && validDay(p.date) && typeof p.text === 'string' && p.text.length >= 1 && p.text.length <= 1500)
      .map(p => ({ id: validId(p.id), date: p.date, text: p.text }))
  };
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
  GROUPS_KEYS.forEach(k => {
    const have = new Set(items(k).map(x => x.id));
    (d[k] as Item[]).forEach(x => { if (!have.has(x.id)) items(k).push(x); });
  });
  try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* bỏ qua */ }
  save();
  toast('Đã đưa dữ liệu cũ vào tài khoản.');
}
