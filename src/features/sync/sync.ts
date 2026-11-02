import type { PostgrestClient } from '@supabase/postgrest-js';
import { appReady, refresh, tab } from '../shell/navigation';
import { $ } from '../../lib/dom';
import { sb } from '../../lib/supabase';
import { S, blank, setS } from '../../state/store';
import type { AppState, Assessment, AudioSession, Post, Program, UserRole } from '../../types';
import type { Database } from '../../types/database';

export const cacheKey = (uid: string) => 'fomo_cache_' + uid;

type Tables = Database['public']['Tables'];
export interface GroupItems { assessments: Assessment; programs: Program; audio: AudioSession; posts: Post }
export interface GroupRows {
  assessments: Tables['assessments']['Row'];
  programs: Tables['programs']['Row'];
  audio: Tables['audio_sessions']['Row'];
  posts: Tables['posts']['Row'];
}
export type GroupKey = keyof GroupItems;
type Groups = { [K in GroupKey]: GroupItems[K][] };
type Snapshot = Record<string, string>; // { id: json }
type SyncedGroups = { [K in GroupKey]?: Snapshot };

export const items = <K extends GroupKey>(k: K): GroupItems[K][] => (S as Groups)[k];

// Mỗi nhóm dữ liệu trong S ứng với một bảng. toRow và fromRow phải cho cùng một JSON để so sánh thay đổi.
export const TABLES: { [K in GroupKey]: { table: string; toRow: (item: GroupItems[K]) => Omit<GroupRows[K], 'user_id'>; fromRow: (row: GroupRows[K]) => GroupItems[K] } } = {
  assessments: {
    table: 'assessments',
    toRow: a => ({ id: a.id, taken_at: a.date, answers: a.answers, score: a.score, kind: a.kind, program_id: a.programId || null }),
    fromRow: r => ({ id: r.id, date: new Date(r.taken_at).toISOString(), answers: r.answers, score: r.score, kind: r.kind, programId: r.program_id })
  },
  programs: {
    table: 'programs',
    toRow: p => ({ id: p.id, days: p.days, start_date: p.start, checks: p.checks, status: p.status, pre_id: p.preId || null, post_id: p.postId || null }),
    // CHECK trong database đảm bảo status; checks do chính app ghi.
    fromRow: r => ({ id: r.id, days: r.days, start: r.start_date, checks: r.checks as Program['checks'], status: r.status as Program['status'], preId: r.pre_id, postId: r.post_id })
  },
  audio: {
    table: 'audio_sessions',
    toRow: a => ({ id: a.id, played_at: a.date, sound: a.sound, seconds: a.seconds }),
    fromRow: r => ({ id: r.id, date: new Date(r.played_at).toISOString(), sound: r.sound, seconds: r.seconds })
  },
  posts: {
    table: 'posts',
    toRow: p => ({ id: p.id, posted_on: p.date, body: p.text }),
    fromRow: r => ({ id: r.id, date: r.posted_on, text: r.body })
  }
};
export const GROUPS_KEYS = Object.keys(TABLES) as GroupKey[];
export const rowJson = <K extends GroupKey>(key: K, item: GroupItems[K]) => JSON.stringify(TABLES[key].toRow(item));

// Tên bảng ở đây là biến nên client không suy ra được cột. Kiểu của dòng dữ liệu do TABLES bảo đảm.
const groupTable = (key: GroupKey) => (sb as unknown as PostgrestClient).from(TABLES[key].table);
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); // id bắt đầu bằng thời gian tạo
// Không có mã lỗi HTTP nghĩa là mất mạng; có mã nghĩa là máy chủ từ chối dữ liệu.
const badgeForError = (e: unknown) => ((e as { code?: unknown } | null)?.code ? 'error' : 'off');

export const Sync = {
  uid: null as string | null,
  synced: {} as SyncedGroups, // { nhóm: { id: json } }: bản đã khớp với máy chủ ở lần gần nhất
  pushing: false, pulling: false, again: false, timer: undefined as number | undefined, retry: undefined as number | undefined,

  loadCache() {
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey(this.uid!)) as string) as { S?: AppState; synced?: SyncedGroups } | null;
      if (c && c.S) { setS(Object.assign(blank(), c.S)); this.synced = c.synced || {}; return true; }
    } catch (e) { /* bộ nhớ đệm hỏng thì lấy lại từ máy chủ */ }
    return false;
  },
  persist() {
    if (!this.uid) return;
    try { localStorage.setItem(cacheKey(this.uid), JSON.stringify({ S, synced: this.synced })); } catch (e) { /* vẫn còn trên máy chủ */ }
  },
  changed() {
    this.persist();
    if (!this.uid) return;
    setSyncBadge('pending');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.push(), 600);
  },
  diff<K extends GroupKey>(key: K) {
    const base: Snapshot = this.synced[key] || {}, now: Snapshot = {};
    items(key).forEach(it => { now[it.id] = rowJson(key, it); });
    return {
      now,
      upserts: items(key).filter(it => now[it.id] !== base[it.id]),
      deletes: Object.keys(base).filter(id => !(id in now))
    };
  },
  isDirty() {
    return GROUPS_KEYS.some(k => { const d = this.diff(k); return d.upserts.length > 0 || d.deletes.length > 0; });
  },
  async push(): Promise<boolean> {
    if (!this.uid) return true;
    if (this.pushing || this.pulling) { this.again = true; return false; }
    this.pushing = true;
    let ok = true;
    try {
      for (const key of GROUPS_KEYS) await this.pushGroup(key);
      this.persist();
    } catch (e) {
      ok = false;
      console.error('Đồng bộ thất bại', e);
      setSyncBadge(badgeForError(e));
      clearTimeout(this.retry);
      this.retry = setTimeout(() => this.push(), 30000);
    }
    this.pushing = false;
    if (this.again) { this.again = false; return this.push(); }
    if (ok) setSyncBadge(this.isDirty() ? 'pending' : 'ok');
    return ok;
  },
  async pushGroup<K extends GroupKey>(key: K): Promise<void> {
    const T = TABLES[key], d = this.diff(key);
    if (d.upserts.length) {
      const rows = d.upserts.map(it => Object.assign({ user_id: this.uid }, T.toRow(it)));
      const { error } = await groupTable(key).upsert(rows, { onConflict: 'user_id,id' });
      if (error) throw error;
    }
    if (d.deletes.length) {
      const { error } = await groupTable(key).delete().eq('user_id', this.uid).in('id', d.deletes);
      if (error) throw error;
    }
    this.synced[key] = d.now;
  },
  // Trộn ba chiều theo từng dòng: thay đổi trên máy này được giữ, còn lại theo máy chủ.
  mergeGroup<K extends GroupKey>(key: K, rows: GroupRows[K][]) {
    const T = TABLES[key], base: Snapshot = this.synced[key] || {}, serverJson: Snapshot = {}, serverItem: Record<string, GroupItems[K]> = {}, local: Record<string, GroupItems[K]> = {};
    rows.forEach(r => { const it = T.fromRow(r); serverItem[it.id] = it; serverJson[it.id] = rowJson(key, it); });
    items(key).forEach(it => { local[it.id] = it; });
    const out: GroupItems[K][] = [];
    new Set([...Object.keys(local), ...Object.keys(serverItem)]).forEach(id => {
      if (!(id in local)) { if (!(id in base)) out.push(serverItem[id]); return; } // đã xóa ở máy này thì bỏ qua
      if (rowJson(key, local[id]) !== base[id]) { out.push(local[id]); return; } // có sửa đổi chưa gửi
      if (id in serverItem) out.push(serverItem[id]); // không sửa: lấy bản máy chủ; máy chủ đã xóa thì bỏ
    });
    out.sort(byId);
    const changed = JSON.stringify(out) !== JSON.stringify(items(key).slice().sort(byId));
    (S as Groups as Record<K, GroupItems[K][]>)[key] = out;
    this.synced[key] = serverJson;
    return changed;
  },
  // Tải dòng của một nhóm, trả về hàm trộn để chỉ trộn khi mọi nhóm đều tải xong.
  async fetchGroup<K extends GroupKey>(key: K, uid: string): Promise<() => boolean> {
    const rows = await fetchAllRows<GroupRows[K]>((from, to) => groupTable(key).select('*').eq('user_id', uid).order('id').range(from, to));
    return () => this.mergeGroup(key, rows);
  },
  async pull(): Promise<boolean> {
    if (!this.uid || this.pushing || this.pulling) return false;
    const uid = this.uid;
    this.pulling = true;
    let changed = false, ok = true;
    try {
      const [{ data: me, error }, merges] = await Promise.all([
        sb.from('profiles').select('username,full_name,class_name,role,approved').eq('id', uid).single(),
        Promise.all(GROUPS_KEYS.map(key => this.fetchGroup(key, uid)))
      ]);
      if (error) throw error;
      // CHECK trong database đảm bảo role là một trong các giá trị của UserRole.
      const prof = { code: me.username, name: me.full_name, cls: me.class_name || '', role: me.role as UserRole, approved: me.approved };
      if (JSON.stringify(prof) !== JSON.stringify(S.profile)) { changed = true; S.profile = prof; }
      for (const merge of merges) changed = merge() || changed;
      this.persist();
    } catch (e) {
      ok = false;
      console.error('Tải dữ liệu thất bại', e);
      setSyncBadge(badgeForError(e));
    }
    this.pulling = false;
    if (ok) await this.push();
    return changed;
  }
};

// Tải từng trang 1000 dòng. page phải tạo truy vấn mới cho mỗi khoảng from..to.
export async function fetchAllRows<R>(page: (from: number, to: number) => PromiseLike<{ data: R[] | null; error: unknown }>): Promise<R[]> {
  const size = 1000; let from = 0; const all: R[] = [];
  for (;;) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < size) return all;
    from += size;
  }
}

export function setSyncBadge(state: 'ok' | 'pending' | 'off' | 'error') {
  const el = $('#syncBadge');
  if (!el) return;
  const M = {
    ok: ['fa-cloud', 'text-teal-100', 'Đã đồng bộ với tài khoản'],
    pending: ['fa-arrows-rotate', 'text-amber-200', 'Đang đồng bộ...'],
    off: ['fa-cloud-arrow-up', 'text-amber-200', 'Mất mạng: dữ liệu lưu tạm trên máy và sẽ tự gửi khi có mạng'],
    error: ['fa-triangle-exclamation', 'text-rose-200', 'Máy chủ từ chối dữ liệu. Hãy tải bản sao lưu và báo thầy cô.']
  }[state];
  el.className = `fa-solid ${M[0]} ${M[1]}`;
  el.parentElement!.title = M[2];
  el.parentElement!.setAttribute('aria-label', M[2]);
}

// Lấy lại dữ liệu mới khi quay lại app, không làm mất nội dung đang nhập.
export function refreshIfSafe() {
  const a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if (appReady && !typing && !$('#fomoForm') && tab < 7) refresh(); // tab Lớp và Quản trị tự tải dữ liệu riêng
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') Sync.pull().then(c => { if (c) refreshIfSafe(); });
});
window.addEventListener('online', () => { Sync.pull().then(c => { if (c) refreshIfSafe(); }); });
