export interface Assessment {
  id: string;
  date: string;
  answers: number[];
  score: number;
  kind: string;
  programId: string | null;
  info?: SurveyInfo | null; // Phần I và III của phiếu khảo sát; kết quả cũ không có
}
export interface SurveyInfo {
  gender?: string; snsTime?: string; snsWhen?: string[];
  wantReduce?: string; readyDetox?: string; support?: string[]; note?: string;
}
export interface Program {
  id: string;
  days: number;
  start: string;
  checks: Record<string, string | null>; // ngày -> ngày tích, null khi bỏ tích
  status: 'active' | 'done' | 'stopped';
  preId: string | null;
  postId: string | null;
}
export interface AudioSession {
  id: string;
  date: string;
  sound: string;
  seconds: number;
}
export interface Post {
  id: string;
  date: string;
  text: string;
}
export type UserRole = 'student' | 'teacher' | 'admin';
export interface Profile {
  code: string;
  name: string;
  cls: string;
  role: UserRole;
  approved: boolean; // học sinh đã được giáo viên lớp xác nhận
}
export interface AppState {
  profile: Profile;
  assessments: Assessment[];
  programs: Program[];
  posts: Post[];
  audio: AudioSession[];
  reminder: boolean;
}
