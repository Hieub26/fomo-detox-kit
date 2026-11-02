import type { HandbookCard, Situation } from '../handbook/content';
import type { QuizItem } from '../quiz/content';
import { sb } from '../../lib/supabase';
import type { Json } from '../../types/database';

// Mọi kiểm tra quyền nằm trong các hàm SQL (security definer). Ở đây chỉ gọi RPC và báo lỗi.
async function rpcOrThrow<T>(call: PromiseLike<{ data: T | null; error: unknown }>): Promise<T | null> {
  const { data, error } = await call;
  if (error) throw error;
  return data;
}

// true nếu mã đúng và tài khoản đã thành quản trị viên.
export async function claimAdmin(code: string) {
  const { data, error } = await sb.rpc('claim_admin', { code });
  return !error && data === true;
}
export const adminResetPassword = (targetId: string, newPass: string) =>
  rpcOrThrow(sb.rpc('admin_reset_password', { target: targetId, new_password: newPass }));
export const adminSetRole = (targetId: string, role: 'student' | 'teacher') =>
  rpcOrThrow(sb.rpc('admin_set_role', { target: targetId, new_role: role }));
export const setStudentApproval = (targetId: string, ok: boolean) =>
  rpcOrThrow(sb.rpc('set_student_approval', { target: targetId, ok }));
export const adminDeleteUser = (targetId: string) => rpcOrThrow(sb.rpc('admin_delete_user', { target: targetId }));
export const adminSaveQuiz = (items: QuizItem[]) => rpcOrThrow(sb.rpc('admin_save_quiz', { items: items as unknown as Json }));
export const adminSaveHandbook = (cards: HandbookCard[], situations: Situation[]) =>
  rpcOrThrow(sb.rpc('admin_save_handbook', { cards: cards as unknown as Json, situations: situations as unknown as Json }));
export const rotateTeacherCode =() => rpcOrThrow(sb.rpc('admin_rotate_teacher_code'));
export const rotateAdminCode = () => rpcOrThrow(sb.rpc('admin_rotate_admin_code'));
