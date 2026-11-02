import { scoreOf } from '../quiz/scoring';
import { uid } from '../../lib/dom';
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
