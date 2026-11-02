export interface Assessment {
  id: string;
  date: string;
  answers: number[];
  score: number;
  kind: string;
  programId: string | null;
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
export interface Profile {
  code: string;
  name: string;
  cls: string;
  role: string;
}
export interface AppState {
  profile: Profile;
  assessments: Assessment[];
  programs: Program[];
  posts: Post[];
  audio: AudioSession[];
  reminder: boolean;
}
