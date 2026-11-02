import { DEFAULT_QUIZ, type QuizItem } from './content';
import { sb } from '../../lib/supabase';

const KEY = 'fomo_quiz';
function cached(): QuizItem[] | null {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// Bộ câu hỏi đang dùng. Lưu lại trong máy để làm trắc nghiệm được khi mất mạng;
// điểm tính ở đây chỉ để hiện ngay, database vẫn tự tính lại khi lưu.
export let QUIZ: QuizItem[] = cached() || DEFAULT_QUIZ;

export function setQuiz(items: QuizItem[]) {
  QUIZ = items;
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* bỏ qua */ }
}

// Trả về true nếu bộ câu hỏi khác bản đang dùng.
export async function loadQuiz() {
  const { data, error } = await sb.from('quiz_questions').select('question,labels,points').order('num');
  if (error || !data || data.length !== DEFAULT_QUIZ.length) return false;
  const changed = JSON.stringify(data) !== JSON.stringify(QUIZ);
  if (changed) setQuiz(data);
  return changed;
}
