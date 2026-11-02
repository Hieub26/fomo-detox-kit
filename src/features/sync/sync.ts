import { appReady, refresh, tab } from '../shell/navigation';
import { $ } from '../../lib/dom';
import { sb } from '../../lib/supabase';
import { S, blank, setS } from '../../state/store';

export const LEGACY_KEY = 'fomo_detox_kit_v2'; // dữ liệu của bản cũ, khi app chưa có tài khoản
export const cacheKey = (uid: string) => 'fomo_cache_' + uid;

// Mỗi nhóm dữ liệu trong S ứng với một bảng. toRow và fromRow phải cho cùng một JSON để so sánh thay đổi.
export type GroupKey = 'assessments' | 'programs' | 'audio' | 'posts';
export type Item = { id: string } & Record<string, any>;
// S chứa nhiều kiểu dữ liệu; phần đồng bộ xử lý chung nên chỉ cần biết mỗi dòng có id.
export const items = (k: GroupKey) => S[k] as unknown as Item[];

export const TABLES: Record<GroupKey, { table: string; toRow: (x: any) => Record<string, unknown>; fromRow: (r: any) => any }> = {
  assessments: {
    table: 'assessments',
    toRow: a => ({ id: a.id, taken_at: a.date, answers: a.answers, score: a.score, kind: a.kind, program_id: a.programId || null }),
    fromRow: r => ({ id: r.id, date: new Date(r.taken_at).toISOString(), answers: r.answers, score: r.score, kind: r.kind, programId: r.program_id })
  },
  programs: {
    table: 'programs',
    toRow: p => ({ id: p.id, days: p.days, start_date: p.start, checks: p.checks, status: p.status, pre_id: p.preId || null, post_id: p.postId || null }),
    fromRow: r => ({ id: r.id, days: r.days, start: r.start_date, checks: r.checks, status: r.status, preId: r.pre_id, postId: r.post_id })
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
export const rowJson = (key: GroupKey, item: Item) => JSON.stringify(TABLES[key].toRow(item));

export const Sync = {
  uid: null as string | null,
  synced: {} as Partial<Record<GroupKey, Record<string, string>>>, // { nhóm: { id: json } }: bản đã khớp với máy chủ ở lần gần nhất
  pushing: false, pulling: false, again: false, timer: undefined as number | undefined, retry: undefined as number | undefined,

  loadCache() {
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey(this.uid!)) as string);
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
  diff(key: GroupKey) {
    const base = this.synced[key] || {}, now: Record<string, string> = {};
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
      for (const key of GROUPS_KEYS) {
        const T = TABLES[key], d = this.diff(key);
        if (d.upserts.length) {
          const rows = d.upserts.map(it => Object.assign({ user_id: this.uid }, T.toRow(it)));
          const { error } = await sb.from(T.table).upsert(rows, { onConflict: 'user_id,id' });
          if (error) throw error;
        }
        if (d.deletes.length) {
          const { error } = await sb.from(T.table).delete().eq('user_id', this.uid).in('id', d.deletes);
          if (error) throw error;
        }
        this.synced[key] = d.now;
      }
      this.persist();
    } catch (e: any) {
      ok = false;
      console.error('Đồng bộ thất bại', e);
      // Không có mã lỗi HTTP nghĩa là mất mạng; có mã nghĩa là máy chủ từ chối dữ liệu.
      setSyncBadge(e && e.code ? 'error' : 'off');
      clearTimeout(this.retry);
      this.retry = setTimeout(() => this.push(), 30000);
    }
    this.pushing = false;
    if (this.again) { this.again = false; return this.push(); }
    if (ok) setSyncBadge(this.isDirty() ? 'pending' : 'ok');
    return ok;
  },
  // Trộn ba chiều theo từng dòng: thay đổi trên máy này được giữ, còn lại theo máy chủ.
  mergeGroup(key: GroupKey, rows: any[]) {
    const T = TABLES[key], base = this.synced[key] || {}, serverJson: Record<string, string> = {}, serverItem: Record<string, Item> = {}, local: Record<string, Item> = {};
    rows.forEach(r => { const it = T.fromRow(r); serverItem[it.id] = it; serverJson[it.id] = rowJson(key, it); });
    items(key).forEach(it => { local[it.id] = it; });
    const out: Item[] = [];
    new Set([...Object.keys(local), ...Object.keys(serverItem)]).forEach(id => {
      if (!(id in local)) { if (!(id in base)) out.push(serverItem[id]); return; } // đã xóa ở máy này thì bỏ qua
      if (rowJson(key, local[id]) !== base[id]) { out.push(local[id]); return; } // có sửa đổi chưa gửi
      if (id in serverItem) out.push(serverItem[id]); // không sửa: lấy bản máy chủ; máy chủ đã xóa thì bỏ
    });
    out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); // id bắt đầu bằng thời gian tạo
    const changed = JSON.stringify(out) !== JSON.stringify(items(key).slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    (S as unknown as Record<GroupKey, Item[]>)[key] = out;
    this.synced[key] = serverJson;
    return changed;
  },
  async pull(): Promise<boolean> {
    if (!this.uid || this.pushing || this.pulling) return false;
    this.pulling = true;
    let changed = false, ok = true;
    try {
      const { data: me, error } = await sb.from('profiles').select('username,full_name,class_name,role').eq('id', this.uid).single();
      if (error) throw error;
      const results = {} as Record<GroupKey, any[]>;
      for (const key of GROUPS_KEYS) results[key] = await fetchAllRows(sb.from(TABLES[key].table).select('*').eq('user_id', this.uid).order('id'));
      const prof = { code: me.username, name: me.full_name, cls: me.class_name || '', role: me.role };
      if (JSON.stringify(prof) !== JSON.stringify(S.profile)) { changed = true; S.profile = prof; }
      for (const key of GROUPS_KEYS) changed = this.mergeGroup(key, results[key]) || changed;
      this.persist();
    } catch (e: any) {
      ok = false;
      console.error('Tải dữ liệu thất bại', e);
      setSyncBadge(e && e.code ? 'error' : 'off');
    }
    this.pulling = false;
    if (ok) await this.push();
    return changed;
  }
};

export async function fetchAllRows(query: any): Promise<any[]> {
  const size = 1000; let from = 0; const all: any[] = [];
  for (;;) {
    const { data, error } = await query.range(from, from + size - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < size) return all;
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
  if (appReady && !typing && !$('#fomoForm') && tab !== 7) refresh();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') Sync.pull().then(c => { if (c) refreshIfSafe(); });
});
window.addEventListener('online', () => { Sync.pull().then(c => { if (c) refreshIfSafe(); }); });
