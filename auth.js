'use strict';
/* Đăng nhập, đăng ký và đồng bộ dữ liệu với Supabase. Nạp sau app.js và teacher.js. */

const CFG = window.FOMO_CONFIG || {};
const sb = CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase
  ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { storageKey: 'fomo-auth' } })
  : null;

const LEGACY_KEY = 'fomo_detox_kit_v2'; // dữ liệu của bản cũ, khi app chưa có tài khoản
const cacheKey = uid => 'fomo_cache_' + uid;
const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
const usernameToEmail = u => `${u}@${CFG.USERNAME_EMAIL_DOMAIN}`;

/* ======================= ĐỒNG BỘ ======================= */
// Mỗi nhóm dữ liệu trong S ứng với một bảng. toRow và fromRow phải cho cùng một JSON để so sánh thay đổi.
const TABLES = {
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
const GROUPS_KEYS = Object.keys(TABLES);
const rowJson = (key, item) => JSON.stringify(TABLES[key].toRow(item));

const Sync = {
  uid: null,
  synced: {}, // { nhóm: { id: json } }: bản đã khớp với máy chủ ở lần gần nhất
  pushing: false, pulling: false, again: false, timer: null, retry: null,

  loadCache() {
    try {
      const c = JSON.parse(localStorage.getItem(cacheKey(this.uid)));
      if (c && c.S) { S = Object.assign(blank(), c.S); this.synced = c.synced || {}; return true; }
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
  diff(key) {
    const base = this.synced[key] || {}, now = {};
    S[key].forEach(it => { now[it.id] = rowJson(key, it); });
    return {
      now,
      upserts: S[key].filter(it => now[it.id] !== base[it.id]),
      deletes: Object.keys(base).filter(id => !(id in now))
    };
  },
  isDirty() {
    return GROUPS_KEYS.some(k => { const d = this.diff(k); return d.upserts.length > 0 || d.deletes.length > 0; });
  },
  async push() {
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
    } catch (e) {
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
  mergeGroup(key, rows) {
    const T = TABLES[key], base = this.synced[key] || {}, serverJson = {}, serverItem = {}, local = {};
    rows.forEach(r => { const it = T.fromRow(r); serverItem[it.id] = it; serverJson[it.id] = rowJson(key, it); });
    S[key].forEach(it => { local[it.id] = it; });
    const out = [];
    new Set([...Object.keys(local), ...Object.keys(serverItem)]).forEach(id => {
      if (!(id in local)) { if (!(id in base)) out.push(serverItem[id]); return; } // đã xóa ở máy này thì bỏ qua
      if (rowJson(key, local[id]) !== base[id]) { out.push(local[id]); return; } // có sửa đổi chưa gửi
      if (id in serverItem) out.push(serverItem[id]); // không sửa: lấy bản máy chủ; máy chủ đã xóa thì bỏ
    });
    out.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); // id bắt đầu bằng thời gian tạo
    const changed = JSON.stringify(out) !== JSON.stringify(S[key].slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)));
    S[key] = out;
    this.synced[key] = serverJson;
    return changed;
  },
  async pull() {
    if (!this.uid || this.pushing || this.pulling) return false;
    this.pulling = true;
    let changed = false, ok = true;
    try {
      const { data: me, error } = await sb.from('profiles').select('username,full_name,class_name,role').eq('id', this.uid).single();
      if (error) throw error;
      const results = {};
      for (const key of GROUPS_KEYS) results[key] = await fetchAllRows(sb.from(TABLES[key].table).select('*').eq('user_id', this.uid).order('id'));
      const prof = { code: me.username, name: me.full_name, cls: me.class_name || '', role: me.role };
      if (JSON.stringify(prof) !== JSON.stringify(S.profile)) { changed = true; S.profile = prof; }
      for (const key of GROUPS_KEYS) changed = this.mergeGroup(key, results[key]) || changed;
      this.persist();
    } catch (e) {
      ok = false;
      console.error('Tải dữ liệu thất bại', e);
      setSyncBadge(e && e.code ? 'error' : 'off');
    }
    this.pulling = false;
    if (ok) await this.push();
    return changed;
  }
};

async function fetchAllRows(query) {
  const size = 1000; let from = 0; const all = [];
  for (;;) {
    const { data, error } = await query.range(from, from + size - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < size) return all;
    from += size;
  }
}

function setSyncBadge(state) {
  const el = document.getElementById('syncBadge');
  if (!el) return;
  const M = {
    ok: ['fa-cloud', 'text-teal-100', 'Đã đồng bộ với tài khoản'],
    pending: ['fa-arrows-rotate', 'text-amber-200', 'Đang đồng bộ...'],
    off: ['fa-cloud-arrow-up', 'text-amber-200', 'Mất mạng: dữ liệu lưu tạm trên máy và sẽ tự gửi khi có mạng'],
    error: ['fa-triangle-exclamation', 'text-rose-200', 'Máy chủ từ chối dữ liệu. Hãy tải bản sao lưu và báo thầy cô.']
  }[state];
  el.className = `fa-solid ${M[0]} ${M[1]}`;
  el.parentElement.title = M[2];
  el.parentElement.setAttribute('aria-label', M[2]);
}

// Lấy lại dữ liệu mới khi quay lại app, không làm mất nội dung đang nhập.
function refreshIfSafe() {
  const a = document.activeElement, typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
  if (appReady && !typing && !document.getElementById('fomoForm') && tab !== 7) refresh();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') Sync.pull().then(c => { if (c) refreshIfSafe(); });
});
window.addEventListener('online', () => { Sync.pull().then(c => { if (c) refreshIfSafe(); }); });

/* ======================= KIỂM TRA DỮ LIỆU NHẬP TỪ FILE ======================= */
// File sao lưu có thể bị sửa tay. Chỉ giữ dòng hợp lệ để một dòng hỏng không chặn cả đợt đồng bộ.
function sanitizeData(d) {
  const validDay = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00'));
  const validId = id => (typeof id === 'string' && id.length >= 1 && id.length <= 40 ? id : uid());
  const list = x => (Array.isArray(x) ? x : []);
  const validStamp = s => typeof s === 'string' && !isNaN(new Date(s));
  return {
    assessments: list(d.assessments)
      .filter(a => a && validStamp(a.date) && Array.isArray(a.answers) && a.answers.length === 10 && a.answers.every(v => [1, 2, 3, 4].includes(v)))
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
function offerLegacyImport() {
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
    const have = new Set(S[k].map(x => x.id));
    d[k].forEach(x => { if (!have.has(x.id)) S[k].push(x); });
  });
  try { localStorage.removeItem(LEGACY_KEY); } catch (e) { /* bỏ qua */ }
  save();
  toast('Đã đưa dữ liệu cũ vào tài khoản.');
}

/* ======================= MÀN HÌNH ĐĂNG NHẬP ======================= */
let authMode = 'login';
const authInput = 'w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500';
const authLabel = 'block text-xs font-semibold text-slate-600 mb-1';

function authError(error) {
  const M = {
    invalid_credentials: 'Sai tên đăng nhập hoặc mật khẩu.',
    user_already_exists: 'Tên đăng nhập này đã có người dùng. Hãy chọn tên khác.',
    weak_password: 'Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự.',
    over_request_rate_limit: 'Bạn thử quá nhiều lần. Hãy đợi vài phút rồi thử lại.',
    signup_disabled: 'Hệ thống đang tạm khóa đăng ký.',
    email_address_invalid: 'Máy chủ không chấp nhận tên đăng nhập này. Hãy báo thầy cô.',
    email_not_confirmed: 'Máy chủ đang bật xác nhận email. Người quản trị cần tắt "Confirm email" trong Supabase.'
  };
  if (M[error.code]) return M[error.code];
  if (error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message || '')) return 'Không kết nối được máy chủ. Hãy kiểm tra mạng rồi thử lại.';
  console.error(error);
  return 'Có lỗi xảy ra. Hãy thử lại sau.';
}

function renderAuth(message) {
  document.getElementById('appShell').classList.add('hidden');
  const box = document.getElementById('authScreen');
  box.classList.remove('hidden');
  if (!sb) {
    box.innerHTML = authFrame(`<h2 class="text-lg font-bold text-slate-800 mb-2">Chưa cấu hình máy chủ</h2>
      <p class="text-sm text-slate-600">Hãy điền <code>SUPABASE_URL</code> và <code>SUPABASE_ANON_KEY</code> trong <code>config.js</code>.</p>`);
    return;
  }
  const signup = authMode === 'signup';
  box.innerHTML = authFrame(`
    <div class="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-5" role="tablist">
      ${[['login', 'Đăng nhập'], ['signup', 'Đăng ký']].map(m => `<button type="button" role="tab" aria-selected="${authMode === m[0]}" onclick="setAuthMode('${m[0]}')" class="py-2 rounded-lg text-sm font-semibold transition ${authMode === m[0] ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}">${m[1]}</button>`).join('')}
    </div>
    <div id="authMsg" role="alert" class="${message ? '' : 'hidden'} mb-4 text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200">${esc(message || '')}</div>
    <form id="authForm" novalidate class="space-y-3">
      ${signup ? `<div><label class="${authLabel}" for="afName">Họ và tên</label><input id="afName" autocomplete="name" maxlength="100" class="${authInput}"></div>` : ''}
      <div><label class="${authLabel}" for="afUser">Tên đăng nhập</label>
        <input id="afUser" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="30" class="${authInput}">
        ${signup ? '<p class="text-[11px] text-slate-500 mt-1">3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới. Ví dụ: linh.8a2</p>' : ''}</div>
      <div><label class="${authLabel}" for="afPass">Mật khẩu</label><input id="afPass" type="password" autocomplete="${signup ? 'new-password' : 'current-password'}" maxlength="72" class="${authInput}">
        ${signup ? '<p class="text-[11px] text-slate-500 mt-1">Ít nhất 8 ký tự.</p>' : ''}</div>
      ${signup ? `<div><label class="${authLabel}" for="afPass2">Nhập lại mật khẩu</label><input id="afPass2" type="password" autocomplete="new-password" maxlength="72" class="${authInput}"></div>
      <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"><input id="afTeacher" type="checkbox" class="accent-teal-600" onchange="toggleTeacherFields(this.checked)"> Tôi là giáo viên</label>
      <div id="afClassWrap"><label class="${authLabel}" for="afClass">Lớp</label><input id="afClass" maxlength="20" placeholder="Ví dụ: 8A2" class="${authInput}"></div>
      <div id="afCodeWrap" class="hidden"><label class="${authLabel}" for="afCode">Mã giáo viên</label><input id="afCode" autocomplete="off" spellcheck="false" class="${authInput}"></div>` : ''}
      <button id="afSubmit" class="w-full py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition">${signup ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
    </form>
    <p class="text-xs text-slate-500 mt-4 text-center">${signup
      ? 'Điểm trắc nghiệm và tiến độ lộ trình sẽ lưu trong tài khoản, giáo viên của lớp xem được. Không dùng tên đăng nhập có thông tin riêng tư.'
      : 'Quên mật khẩu? Nhờ giáo viên của lớp đặt lại giúp bạn.'}</p>`);
  document.getElementById('authForm').addEventListener('submit', submitAuth);
}
function authFrame(inner) {
  return `<div class="w-full max-w-md">
    <div class="text-center text-white mb-5">
      <div class="w-14 h-14 mx-auto rounded-2xl bg-white/20 flex items-center justify-center mb-3"><i class="fa-solid fa-brain text-2xl text-teal-100"></i></div>
      <h1 class="font-bold text-2xl tracking-tight">FOMO DETOX KIT</h1>
      <p class="text-xs text-teal-100 mt-1">Trường THCS Nguyễn Tất Thành, Thái Nguyên</p>
    </div>
    <div class="bg-white rounded-2xl shadow-xl p-6">${inner}</div></div>`;
}
function setAuthMode(m) { authMode = m; renderAuth(); }
function toggleTeacherFields(on) {
  document.getElementById('afClassWrap').classList.toggle('hidden', on);
  document.getElementById('afCodeWrap').classList.toggle('hidden', !on);
}
function showAuthMsg(msg) {
  const m = document.getElementById('authMsg');
  m.textContent = msg; m.classList.remove('hidden');
}
async function submitAuth(e) {
  e.preventDefault();
  const val = id => { const x = document.getElementById(id); return x ? x.value : ''; };
  const username = val('afUser').trim().toLowerCase(), password = val('afPass');
  const signup = authMode === 'signup';
  const teacher = signup && document.getElementById('afTeacher').checked;
  if (!USERNAME_RE.test(username)) return showAuthMsg(signup ? 'Tên đăng nhập cần 3–30 ký tự: chữ không dấu, số, dấu chấm hoặc gạch dưới.' : 'Sai tên đăng nhập hoặc mật khẩu.');
  if (signup) {
    if (!val('afName').trim()) return showAuthMsg('Hãy nhập họ và tên.');
    if (password.length < 8) return showAuthMsg('Mật khẩu cần ít nhất 8 ký tự.');
    if (password !== val('afPass2')) return showAuthMsg('Hai lần nhập mật khẩu không giống nhau.');
    if (!teacher && !val('afClass').trim()) return showAuthMsg('Hãy nhập lớp, ví dụ 8A2.');
    if (teacher && !val('afCode').trim()) return showAuthMsg('Hãy nhập mã giáo viên.');
  } else if (!password) return showAuthMsg('Hãy nhập mật khẩu.');

  const btn = document.getElementById('afSubmit');
  btn.disabled = true; btn.classList.add('opacity-60');
  try {
    const email = usernameToEmail(username);
    if (signup) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { full_name: val('afName').trim(), class_name: teacher ? null : val('afClass').trim() } } });
      if (error) throw error;
      if (!data.session) throw { code: 'email_not_confirmed' };
      let wrongCode = false;
      if (teacher) {
        const r = await sb.rpc('claim_teacher', { code: val('afCode').trim() });
        wrongCode = r.error || !r.data;
      }
      await enterApp(data.user);
      if (wrongCode) toast('Mã giáo viên không đúng nên tài khoản đang là học sinh. Có thể nhập lại ở Hồ sơ.');
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await enterApp(data.user);
    }
  } catch (err) {
    showAuthMsg(authError(err));
    btn.disabled = false; btn.classList.remove('opacity-60');
  }
}

/* ======================= VÀO, RA ======================= */
async function enterApp(user) {
  Sync.uid = user.id;
  const cached = Sync.loadCache();
  const authBox = document.getElementById('authScreen');
  authBox.classList.add('hidden');
  authBox.innerHTML = ''; // không giữ mật khẩu vừa nhập trong trang
  document.getElementById('appShell').classList.remove('hidden');
  if (cached) bootApp();
  else document.getElementById('module-1').innerHTML = '<p class="text-center text-slate-500 py-16"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</p>';
  const changed = await Sync.pull();
  offerLegacyImport();
  if (!cached) bootApp(); else if (changed) refreshIfSafe();
}
let loggingOut = false;
async function logout() {
  clearTimeout(Sync.timer);
  await Sync.push();
  if (Sync.isDirty() && !confirm('Còn dữ liệu chưa gửi lên máy chủ và sẽ bị mất nếu đăng xuất. Vẫn đăng xuất?')) return;
  loggingOut = true;
  try { localStorage.removeItem(cacheKey(Sync.uid)); } catch (e) { /* bỏ qua */ }
  await sb.auth.signOut({ scope: 'local' });
  location.hash = '';
  location.reload();
}
if (sb) sb.auth.onAuthStateChange(ev => {
  // Phiên bị thu hồi (ví dụ giáo viên vừa đặt lại mật khẩu) hoặc đăng xuất ở tab khác.
  if (ev === 'SIGNED_OUT' && !loggingOut && Sync.uid) {
    try { sessionStorage.setItem('fomo_auth_msg', 'Phiên đăng nhập đã kết thúc. Hãy đăng nhập lại.'); } catch (e) { /* bỏ qua */ }
    location.reload();
  }
});

(async function start() {
  if (!sb) return renderAuth();
  let msg = '';
  try { msg = sessionStorage.getItem('fomo_auth_msg') || ''; sessionStorage.removeItem('fomo_auth_msg'); } catch (e) { /* bỏ qua */ }
  const { data } = await sb.auth.getSession();
  if (data.session) await enterApp(data.session.user);
  else renderAuth(msg);
})();
