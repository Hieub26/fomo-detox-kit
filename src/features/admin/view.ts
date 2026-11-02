import type { Assessment, Program, UserRole } from '../../types';
import { adminDeleteUser, adminResetPassword, adminSetRole, rotateAdminCode, rotateTeacherCode, setStudentApproval } from './api';
import { checkedCount, pct } from '../program/progress';
import { compareHtml, lineChart } from '../progress/charts';
import { GROUPS, LEVELS, MAXSCORE } from '../quiz/content';
import { byDate, groupScore, levelIdx, lvBadge } from '../quiz/scoring';
import { tab } from '../shell/navigation';
import { TABLES, fetchAllRows } from '../sync/sync';
import { randomPassword } from '../teacher/view';
import { $, bt, card, download, esc, fmtDate, toCsv, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { sb } from '../../lib/supabase';

interface Account { id: string; username: string; full_name: string; class_name: string | null; role: UserRole; approved: boolean }
const NO_CLASS = '(Chưa có lớp)';
const MAX_ROWS = 200; // toàn trường có thể rất nhiều học sinh; chỉ vẽ một phần, tìm kiếm để thu hẹp
const ROLE_LABEL: Record<UserRole, string> = { student: 'Học sinh', teacher: 'Giáo viên', admin: 'Quản trị' };

const A = {
  accounts: [] as Account[], classes: {} as Record<string, string[]>, // teacher_id -> lớp
  assess: {} as Record<string, Assessment[]>, programs: {} as Record<string, Program[]>,
  q: '', cls: '', role: '' as UserRole | 'pending' | '', selected: null as string | null,
  tempPass: null as { id: string; value: string } | null,
  codes: {} as { teacher?: string; admin?: string },
  error: ''
};

const name = (a: Account) => a.full_name || a.username;
const byRole = (r: UserRole) => A.accounts.filter(a => a.role === r);
// Thống kê chỉ tính học sinh đã được giáo viên xác nhận vào lớp; tài khoản tự khai lớp thì chờ xác nhận.
const enrolled = () => A.accounts.filter(a => a.role === 'student' && a.approved);
const isPending = (a: Account) => a.role === 'student' && !a.approved && !!a.class_name;
const latest = <X>(list: X[] | undefined) => (list && list.length ? list[list.length - 1] : undefined);

export async function loadAdminData() {
  // RLS cho quản trị viên đọc mọi hồ sơ, điểm và lộ trình; Góc Ẩn Danh thì không.
  const accounts = await fetchAllRows((from, to) => sb.from('profiles').select('id,username,full_name,class_name,role,approved').order('class_name').order('full_name').range(from, to));
  A.accounts = accounts.map(a => ({ ...a, role: a.role as UserRole })); // CHECK trong database đảm bảo role
  const cls = await fetchAllRows((from, to) => sb.from('teacher_classes').select('teacher_id,class_name').order('teacher_id').order('class_name').range(from, to));
  A.classes = {};
  cls.forEach(c => { (A.classes[c.teacher_id] = A.classes[c.teacher_id] || []).push(c.class_name); });
  const group = <R extends { user_id: string }, X>(rows: R[], convert: (r: R) => X) => {
    const out: Record<string, X[]> = {};
    rows.forEach(r => { (out[r.user_id] = out[r.user_id] || []).push(convert(r)); });
    return out;
  };
  A.assess = group(await fetchAllRows((from, to) => sb.from('assessments').select('*').order('user_id').order('id').range(from, to)), TABLES.assessments.fromRow);
  A.programs = group(await fetchAllRows((from, to) => sb.from('programs').select('*').order('user_id').order('id').range(from, to)), TABLES.programs.fromRow);
  Object.values(A.assess).forEach(l => l.sort(byDate));
}

export function renderAdmin() {
  const box = $('#module-8');
  box.innerHTML = '<p class="text-center text-slate-500 py-16"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu toàn trường...</p>';
  loadAdminData().then(() => { A.error = ''; drawAdmin(); }).catch(e => {
    console.error(e);
    A.error = 'Không tải được dữ liệu. Hãy kiểm tra mạng rồi thử lại.';
    drawAdmin();
  });
}

const tile = (label: string, value: string | number, note?: string) => `<div class="${card} !p-4"><div class="text-xs text-slate-500">${label}</div><div class="text-2xl font-black text-slate-800 mt-1">${value}</div>${note ? `<div class="text-[11px] text-slate-400 mt-0.5">${note}</div>` : ''}</div>`;
const tempPassNote = (id: string, who: string) => (A.tempPass && A.tempPass.id === id
  ? `<div class="mt-2 text-sm rounded-xl px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200 whitespace-normal">Mật khẩu mới: <code class="font-bold select-all">${esc(A.tempPass.value)}</code>. Hãy đưa riêng cho ${who} và nhắc đổi lại ở mục Hồ sơ. Mật khẩu chỉ hiện một lần.</div>`
  : '');
const smallBtn = 'px-2.5 py-1 border border-slate-200 rounded-lg text-xs hover:bg-slate-50 whitespace-nowrap';

export function drawAdmin() {
  if (tab !== 8) return;
  const students = enrolled(), teachers = byRole('teacher'), pending = A.accounts.filter(isPending).length;
  const done = students.filter(s => (A.assess[s.id] || []).length);
  const high = done.filter(s => levelIdx(latest(A.assess[s.id])!.score) === 2).length;
  const allPrograms = students.flatMap(s => A.programs[s.id] || []);
  const finished = allPrograms.filter(p => p.status === 'done').length;
  const latestPct = students.map(s => latest(A.programs[s.id])).filter((p): p is Program => !!p).map(pct);
  const avgPct = latestPct.length ? Math.round(latestPct.reduce((a, b) => a + b, 0) / latestPct.length) + '%' : '–';

  $('#module-8').innerHTML = `
    ${A.error ? `<div class="text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200">${esc(A.error)}</div>` : ''}
    <div class="${card}">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div><h2 class="font-bold text-xl text-slate-800 mb-1"><i class="fa-solid fa-user-shield text-teal-600 mr-1"></i> Quản Trị Toàn Trường</h2>
          <p class="text-xs text-slate-500">Xem kết quả của mọi lớp, phân công lớp cho giáo viên, xác nhận học sinh, đặt lại mật khẩu, xóa tài khoản và đổi mã kích hoạt. Quản trị viên không xem được Góc Ẩn Danh.</p></div>
        <div class="flex gap-2"><button data-click="adminExportResearch" class="${bt} bg-teal-600 hover:bg-teal-700 !py-1.5" title="Mỗi dòng là một lần làm trắc nghiệm, không kèm họ tên"><i class="fa-solid fa-file-csv mr-1"></i> Xuất dữ liệu nghiên cứu</button>
        <button data-click="renderAdmin" aria-label="Tải lại" title="Tải lại" class="w-9 h-9 border border-slate-200 rounded-lg hover:bg-slate-50"><i class="fa-solid fa-rotate-right text-slate-500"></i></button></div>
      </div>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4">
      ${tile('Học sinh', students.length, pending ? `đã xác nhận • ${pending} chờ xác nhận` : 'đã xác nhận vào lớp')}
      ${tile('Giáo viên', teachers.length)}
      ${tile('Đã làm trắc nghiệm', done.length, students.length ? Math.round(done.length / students.length * 100) + '% học sinh' : '')}
      ${tile('Đang ở mức Cao', high, 'theo lần gần nhất')}
      ${tile('Lộ trình đã hoàn thành', allPrograms.length ? Math.round(finished / allPrograms.length * 100) + '%' : '–', `${finished}/${allPrograms.length} lộ trình`)}
      ${tile('Mức hoàn thành trung bình', avgPct, 'lộ trình gần nhất của mỗi học sinh')}
    </div>
    ${classTable()}
    ${teacherCard()}
    <div class="${card}">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 class="font-bold text-lg text-slate-800">Tài Khoản</h3>
        <div class="flex gap-2 items-center flex-wrap">
          <input type="search" data-input="adminSearch" value="${esc(A.q)}" placeholder="Tìm tên hoặc tên đăng nhập" aria-label="Tìm tài khoản" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm w-52">
          <select data-change="adminFilterRole" aria-label="Lọc theo vai trò" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
            <option value="">Mọi vai trò</option>${(['student', 'teacher', 'admin'] as UserRole[]).map(r => `<option value="${r}" ${A.role === r ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}<option value="pending" ${A.role === 'pending' ? 'selected' : ''}>Chờ xác nhận lớp</option></select>
          <select data-change="adminFilterClass" aria-label="Lọc theo lớp" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
            <option value="">Tất cả lớp</option>${classNames().map(c => `<option value="${esc(c)}" ${A.cls === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <button data-click="adminExportCsv" class="${bt} bg-indigo-600 hover:bg-indigo-700 !py-1.5">Xuất CSV</button>
        </div>
      </div>
      <div id="adminUsers">${usersHtml()}</div>
    </div>
    ${codesCard()}`;
}

function classNames() {
  const set = new Set<string>();
  byRole('student').forEach(s => set.add(s.class_name || NO_CLASS));
  Object.values(A.classes).forEach(l => l.forEach(c => set.add(c)));
  return [...set].sort((a, b) => (a === NO_CLASS ? 1 : b === NO_CLASS ? -1 : a.localeCompare(b, 'vi', { numeric: true })));
}

function classTable() {
  const teacherOf: Record<string, string[]> = {};
  byRole('teacher').forEach(t => (A.classes[t.id] || []).forEach(c => { (teacherOf[c] = teacherOf[c] || []).push(name(t)); }));
  const rows = classNames().map(c => {
    const all = byRole('student').filter(s => (s.class_name || NO_CLASS) === c), list = all.filter(s => s.approved);
    const done = list.filter(s => (A.assess[s.id] || []).length);
    const high = done.filter(s => levelIdx(latest(A.assess[s.id])!.score) === 2).length;
    const ps = list.map(s => latest(A.programs[s.id])).filter((p): p is Program => !!p).map(pct);
    return { c, n: list.length, wait: all.filter(isPending).length, done: done.length, high, avg: ps.length ? Math.round(ps.reduce((a, b) => a + b, 0) / ps.length) + '%' : '–', teachers: teacherOf[c] || [] };
  });
  return `<div class="${card}">
    <h3 class="font-bold text-lg text-slate-800 mb-3">Theo Lớp</h3>
    ${rows.length ? `<div class="overflow-x-auto custom-scrollbar"><table class="w-full text-sm text-left whitespace-nowrap">
      <tr class="text-xs text-slate-500"><th class="py-2 pr-3">Lớp</th><th class="pr-3">Học sinh</th><th class="pr-3">Chờ xác nhận</th><th class="pr-3">Đã làm TN</th><th class="pr-3">Mức Cao</th><th class="pr-3">Hoàn thành TB</th><th>Giáo viên phụ trách</th></tr>
      ${rows.map(r => `<tr class="border-t border-slate-100">
        <td class="py-2 pr-3 font-semibold text-slate-800">${esc(r.c)}</td><td class="pr-3">${r.n}</td><td class="pr-3 ${r.wait ? 'text-amber-700 font-semibold' : 'text-slate-400'}">${r.wait || ''}</td><td class="pr-3">${r.done}</td><td class="pr-3">${r.high}</td><td class="pr-3">${r.avg}</td>
        <td class="${r.teachers.length ? '' : 'text-slate-400'}">${r.c === NO_CLASS ? '' : r.teachers.length ? esc(r.teachers.join(', ')) : 'Chưa có'}</td></tr>`).join('')}
    </table></div>` : '<p class="text-sm text-slate-500">Chưa có lớp nào.</p>'}
  </div>`;
}

function teacherCard() {
  const teachers = byRole('teacher');
  return `<div class="${card}">
    <h3 class="font-bold text-lg text-slate-800 mb-1">Giáo Viên &amp; Phân Công Lớp</h3>
    <p class="text-xs text-slate-500 mb-3">Giáo viên xem được học sinh của các lớp được gán. Muốn chỉ định giáo viên mới, tìm tài khoản ở mục Tài Khoản bên dưới.</p>
    ${teachers.length ? `<div class="divide-y divide-slate-100">${teachers.map(t => `
      <div class="py-3">
        <div class="flex items-start justify-between flex-wrap gap-2">
          <div><div class="font-semibold text-slate-800">${esc(name(t))}</div><div class="text-[11px] text-slate-400">${esc(t.username)}</div></div>
          <div class="flex gap-2">
            <button data-click="adminResetPassword" data-arg="${esc(t.id)}" class="${smallBtn}"><i class="fa-solid fa-key mr-1"></i>Đặt lại mật khẩu</button>
            <button data-click="adminDemote" data-arg="${esc(t.id)}" class="${smallBtn} text-rose-700">Gỡ quyền giáo viên</button>
          </div>
        </div>
        <div class="flex flex-wrap gap-2 items-center mt-2">
          ${(A.classes[t.id] || []).map(c => `<span class="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold pl-3 pr-1 py-1 rounded-full">${esc(c)}
            <button data-click="adminRemoveClass" data-arg="${esc(t.id)}" data-cls="${esc(c)}" aria-label="Bỏ lớp ${esc(c)} của ${esc(name(t))}" class="w-6 h-6 rounded-full hover:bg-teal-100"><i class="fa-solid fa-xmark"></i></button></span>`).join('') || '<span class="text-xs text-slate-400">Chưa được gán lớp.</span>'}
          <form data-submit="adminAddClass" data-arg="${esc(t.id)}" class="flex gap-1.5">
            <input maxlength="20" placeholder="Thêm lớp, ví dụ 8A2" aria-label="Thêm lớp cho ${esc(name(t))}" class="border border-slate-200 rounded-lg px-2 py-1 text-xs w-36">
            <button class="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold">Gán</button></form>
        </div>
        ${tempPassNote(t.id, 'giáo viên')}
      </div>`).join('')}</div>` : '<p class="text-sm text-slate-500">Chưa có giáo viên nào.</p>'}
  </div>`;
}

function filteredAccounts() {
  const q = A.q.trim().toLowerCase();
  return A.accounts.filter(a => (!A.role || (A.role === 'pending' ? isPending(a) : a.role === A.role))
    && (!A.cls || (a.role === 'student' ? (a.class_name || NO_CLASS) === A.cls : (A.classes[a.id] || []).includes(A.cls)))
    && (!q || a.username.includes(q) || a.full_name.toLowerCase().includes(q)));
}

function usersHtml() {
  const all = filteredAccounts(), rows = all.slice(0, MAX_ROWS);
  if (!rows.length) return '<p class="text-sm text-slate-500">Không có tài khoản nào khớp.</p>';
  return `<div class="overflow-x-auto custom-scrollbar"><table class="w-full text-sm text-left whitespace-nowrap">
    <tr class="text-xs text-slate-500"><th class="py-2 pr-3">Họ tên</th><th class="pr-3">Vai trò</th><th class="pr-3">Lớp</th><th class="pr-3">Số lần TN</th><th class="pr-3">Gần nhất</th><th class="pr-3">Lộ trình</th><th></th></tr>
    ${rows.map(a => {
      const as = A.assess[a.id] || [], last = latest(as), p = latest(A.programs[a.id]);
      const cls = a.role === 'student' ? a.class_name || '' : (A.classes[a.id] || []).join(', ');
      const actions = a.role === 'admin' ? '' : `
        ${isPending(a) ? `<button data-click="adminApprove" data-arg="${esc(a.id)}" class="${smallBtn} !bg-teal-600 !text-white !border-teal-600">Xác nhận lớp</button>` : ''}
        ${a.role === 'student' ? `<button data-click="adminSelect" data-arg="${esc(a.id)}" class="${smallBtn}">Chi tiết</button>` : ''}
        <button data-click="adminResetPassword" data-arg="${esc(a.id)}" class="${smallBtn}" title="Đặt lại mật khẩu" aria-label="Đặt lại mật khẩu cho ${esc(name(a))}"><i class="fa-solid fa-key"></i></button>
        ${a.role === 'student'
          ? `<button data-click="adminPromote" data-arg="${esc(a.id)}" class="${smallBtn} text-indigo-700">Đặt làm giáo viên</button>`
          : `<button data-click="adminDemote" data-arg="${esc(a.id)}" class="${smallBtn} text-rose-700">Gỡ quyền giáo viên</button>`}
        <button data-click="adminDelete" data-arg="${esc(a.id)}" class="${smallBtn} text-rose-700" title="Xóa tài khoản" aria-label="Xóa tài khoản ${esc(name(a))}"><i class="fa-solid fa-trash-can"></i></button>`;
      return `<tr class="border-t border-slate-100 ${A.selected === a.id ? 'bg-teal-50/60' : ''}">
        <td class="py-2 pr-3"><div class="font-semibold text-slate-800">${esc(name(a))}</div><div class="text-[11px] text-slate-400">${esc(a.username)}</div></td>
        <td class="pr-3">${ROLE_LABEL[a.role]}${isPending(a) ? ' <span class="ml-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">Chờ xác nhận</span>' : ''}</td><td class="pr-3">${esc(cls)}</td>
        <td class="pr-3">${a.role === 'student' ? as.length : ''}</td><td class="pr-3">${last ? lvBadge(last.score) : ''}</td>
        <td class="pr-3">${p ? `${p.days} ngày • ${pct(p)}%` : ''}</td>
        <td class="text-right"><div class="flex gap-1.5 justify-end">${actions}</div></td></tr>
        ${A.tempPass && A.tempPass.id === a.id ? `<tr><td colspan="7">${tempPassNote(a.id, a.role === 'teacher' ? 'giáo viên' : 'học sinh')}</td></tr>` : ''}`;
    }).join('')}
  </table></div>
  ${all.length > rows.length ? `<p class="text-xs text-slate-500 mt-2">Đang hiện ${rows.length}/${all.length} tài khoản. Hãy tìm kiếm hoặc lọc theo lớp để thu hẹp.</p>` : ''}
  ${studentDetail()}`;
}

function studentDetail() {
  const s = A.accounts.find(x => x.id === A.selected && x.role === 'student');
  if (!s) return '';
  const as = A.assess[s.id] || [], ps = A.programs[s.id] || [];
  const progs = ps.slice().reverse().map(p => {
    const pre = as.find(a => a.id === p.preId), post = as.find(a => a.id === p.postId);
    const st = p.status === 'active' ? 'đang thực hiện' : p.status === 'done' ? 'đã xong' : 'đã dừng';
    return `<div class="mt-3 p-4 border border-slate-200 rounded-xl"><h4 class="font-bold text-sm">Lộ trình ${p.days} ngày • ${fmtDate(p.start)}</h4>
      <p class="text-xs text-slate-500 mb-2">Hoàn thành ${checkedCount(p)}/${p.days} ngày (${pct(p)}%) • ${st}</p>
      ${pre && post ? compareHtml(pre, post) : '<p class="text-xs text-slate-500">Chưa đủ khảo sát trước và sau để so sánh.</p>'}</div>`;
  }).join('');
  return `<div class="mt-4 p-4 border border-teal-200 rounded-xl">
    <h3 class="font-bold text-lg text-slate-800">${esc(name(s))} <span class="text-xs font-normal text-slate-500">(${esc(s.username)} • ${esc(s.class_name || NO_CLASS)})</span></h3>
    ${as.length ? `<div class="max-w-xl mt-3">${lineChart(as)}</div>
      <div class="overflow-x-auto mt-2"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500"><th class="py-1">Ngày</th><th>Loại</th><th>Điểm</th><th>Mức</th></tr>
      ${as.slice().reverse().map(a => `<tr class="border-t border-slate-100"><td class="py-1.5">${fmtDate(a.date)}</td><td>${esc(a.kind)}</td><td class="font-semibold">${a.score}/${MAXSCORE}</td><td>${lvBadge(a.score)}</td></tr>`).join('')}</table></div>` : '<p class="text-sm text-slate-500 mt-2">Học sinh chưa làm trắc nghiệm.</p>'}
    ${progs}</div>`;
}

function codesCard() {
  const shown = (code: string | undefined, who: string) => (code
    ? `<div class="mt-2 text-sm rounded-xl px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200">Mã mới: <code class="font-bold select-all">${esc(code)}</code>. Chỉ đưa cho ${who}. Mã chỉ hiện một lần; mã cũ đã hết hiệu lực.</div>`
    : '');
  return `<div class="${card}">
    <h3 class="font-bold text-lg text-slate-800 mb-1"><i class="fa-solid fa-key text-amber-600 mr-1"></i> Mã Kích Hoạt</h3>
    <p class="text-xs text-slate-500 mb-3">Máy chủ chỉ lưu bản băm nên không xem lại được mã đang dùng. Tạo mã mới khi cần cấp cho người mới hoặc khi mã bị lộ. Tài khoản đã kích hoạt không bị ảnh hưởng.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 border border-slate-200 rounded-xl"><h4 class="font-semibold text-sm mb-2">Mã giáo viên</h4>
        <button data-click="adminRotateTeacherCode" class="${bt} bg-indigo-600 hover:bg-indigo-700">Tạo mã giáo viên mới</button>${shown(A.codes.teacher, 'giáo viên')}</div>
      <div class="p-4 border border-slate-200 rounded-xl"><h4 class="font-semibold text-sm mb-2">Mã quản trị</h4>
        <button data-click="adminRotateAdminCode" class="${bt} bg-slate-700 hover:bg-slate-800">Tạo mã quản trị mới</button>${shown(A.codes.admin, 'người quản trị')}</div>
    </div>
  </div>`;
}

const drawUsers = () => { const el = $('#adminUsers'); if (el) el.innerHTML = usersHtml(); };
const find = (id: string) => A.accounts.find(a => a.id === id);
const failed = (e: unknown, msg: string) => { console.error(e); toast(msg); };

export async function resetPassword(id: string) {
  const a = find(id);
  if (!a || !confirm(`Đặt lại mật khẩu cho ${name(a)} (${a.username})? Tài khoản sẽ bị đăng xuất khỏi mọi thiết bị.`)) return;
  const value = randomPassword();
  try { await adminResetPassword(id, value); } catch (e) { failed(e, 'Không đặt lại được mật khẩu.'); return; }
  A.tempPass = { id, value };
  drawAdmin();
}
async function setRole(id: string, role: 'student' | 'teacher') {
  const a = find(id);
  if (!a) return;
  const ask = role === 'teacher'
    ? `Chỉ định ${name(a)} (${a.username}) làm giáo viên? Tài khoản sẽ không còn thuộc lớp ${a.class_name || ''} như học sinh.`
    : `Gỡ quyền giáo viên của ${name(a)} (${a.username})? Các lớp đã gán sẽ bị bỏ và tài khoản trở thành học sinh.`;
  if (!confirm(ask)) return;
  try { await adminSetRole(id, role); } catch (e) { failed(e, 'Không đổi được vai trò.'); return; }
  toast(role === 'teacher' ? 'Đã chỉ định giáo viên. Hãy gán lớp cho giáo viên này.' : 'Đã gỡ quyền giáo viên.');
  A.tempPass = null;
  renderAdmin();
}
export async function addClass(form: HTMLElement, teacherId: string) {
  const input = form.querySelector('input')!, cls = input.value.trim();
  if (!cls) return;
  const { error } = await sb.from('teacher_classes').insert({ teacher_id: teacherId, class_name: cls });
  if (error && error.code !== '23505') { failed(error, 'Không gán được lớp. Hãy thử lại.'); return; }
  renderAdmin();
}
export async function removeClass(teacherId: string, cls: string) {
  const t = find(teacherId);
  if (!t || !confirm(`Bỏ lớp ${cls} khỏi giáo viên ${name(t)}? Dữ liệu học sinh không bị xóa.`)) return;
  const { error } = await sb.from('teacher_classes').delete().eq('teacher_id', teacherId).eq('class_name', cls);
  if (error) { failed(error, 'Không bỏ được lớp. Hãy thử lại.'); return; }
  renderAdmin();
}
async function approve(id: string) {
  try { await setStudentApproval(id, true); } catch (e) { failed(e, 'Không xác nhận được.'); return; }
  toast('Đã xác nhận học sinh vào lớp.');
  renderAdmin();
}
// Xóa hẳn tài khoản cùng mọi dữ liệu (điểm, lộ trình, Góc Ẩn Danh). Phải gõ đúng tên đăng nhập để tránh bấm nhầm.
async function deleteAccount(id: string) {
  const a = find(id);
  if (!a) return;
  const typed = prompt(`XÓA VĨNH VIỄN tài khoản ${name(a)} cùng toàn bộ điểm, lộ trình và bài ở Góc Ẩn Danh. Không thể hoàn tác.

Gõ tên đăng nhập "${a.username}" để xác nhận:`);
  if (typed === null) return;
  if (typed.trim().toLowerCase() !== a.username) { toast('Tên đăng nhập không khớp, chưa xóa gì.'); return; }
  try { await adminDeleteUser(id); } catch (e) { failed(e, 'Không xóa được tài khoản.'); return; }
  toast(`Đã xóa tài khoản ${a.username}.`);
  if (A.selected === id) A.selected = null;
  renderAdmin();
}
async function rotate(kind: 'teacher' | 'admin') {
  const ask = kind === 'teacher'
    ? 'Tạo mã giáo viên mới? Mã cũ sẽ hết hiệu lực ngay.'
    : 'Tạo mã quản trị mới? Mã cũ sẽ hết hiệu lực ngay. Ai có mã này đều có thể thành quản trị viên.';
  if (!confirm(ask)) return;
  try { A.codes[kind] = (await (kind === 'teacher' ? rotateTeacherCode() : rotateAdminCode())) ?? undefined; } catch (e) { failed(e, 'Không tạo được mã mới.'); return; }
  drawAdmin();
}
// Dữ liệu cho phân tích nghiên cứu: mỗi dòng là một lần làm trắc nghiệm của học sinh, kèm đáp án từng câu.
// Không có họ tên hay tên đăng nhập: mỗi học sinh được đánh mã HS001, HS002... theo thứ tự cố định trong lần xuất.
// Mã chỉ ổn định trong cùng một lần xuất; nếu có tài khoản mới thì mã có thể dịch chuyển.
export function exportResearch() {
  const students = byRole('student').slice().sort((a, b) => (a.id < b.id ? -1 : 1));
  const head = ['ma_hs', 'lop', 'da_xac_nhan_lop', 'lan_thu', 'ngay', 'loai', 'lo_trinh_ngay', 'lo_trinh_trang_thai', 'lo_trinh_phan_tram',
    'tong_diem_10_40', 'muc', ...GROUPS.map((_, i) => 'nhom_' + (i + 1)), ...Array.from({ length: 10 }, (_, i) => 'c' + (i + 1))];
  const rows: (string | number)[][] = [];
  students.forEach((s, n) => {
    const code = 'HS' + String(n + 1).padStart(3, '0'), ps = A.programs[s.id] || [];
    (A.assess[s.id] || []).forEach((a, k) => {
      // "truoc": điểm gốc của một lộ trình; "sau": khảo sát sau lộ trình; "thuong": làm lại ngoài lộ trình.
      const pre = ps.find(p => p.preId === a.id), post = ps.find(p => p.postId === a.id) || (a.kind === 'sau' ? ps.find(p => p.id === a.programId) : undefined);
      const p = post || pre;
      rows.push([code, s.class_name || '', s.approved ? 1 : 0, k + 1, a.date.slice(0, 10), post ? 'sau' : pre ? 'truoc' : 'thuong',
        p ? p.days : '', p ? p.status : '', p ? pct(p) : '', a.score, LEVELS[levelIdx(a.score)].short,
        ...GROUPS.map(g => groupScore(a.answers, g)), ...a.answers]);
    });
  });
  if (!rows.length) { toast('Chưa có lần làm trắc nghiệm nào để xuất.'); return; }
  const note = [['# Ghi chú: c1-c10 là đáp án gốc 1-4. Tổng điểm tính câu 10 ngược (5 - c10). Nhóm: ' + GROUPS.map((g, i) => `nhom_${i + 1}=${g.name} (câu ${g.items.join(',')})`).join('; ')]];
  download(`fomo-du-lieu-nghien-cuu-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([head, ...rows, [], ...note]), 'text/csv');
  toast(`Đã xuất ${rows.length} lần làm trắc nghiệm của ${new Set(rows.map(r => r[0])).size} học sinh.`);
}
export function exportCsv() {
  const head = ['ten_dang_nhap', 'ho_ten', 'vai_tro', 'lop', 'so_lan', 'diem_dau', 'diem_gan_nhat', 'thay_doi', 'muc', 'lo_trinh_ngay', 'phan_tram_hoan_thanh'];
  const rows = filteredAccounts().map(a => {
    const as = A.assess[a.id] || [], f = as[0], l = latest(as), p = latest(A.programs[a.id]);
    return [a.username, a.full_name, a.role, a.role === 'student' ? a.class_name : (A.classes[a.id] || []).join(' '), as.length,
      f ? f.score : '', l ? l.score : '', as.length > 1 ? l!.score - f.score : '', l ? LEVELS[levelIdx(l.score)].short : '',
      p ? p.days : '', p ? pct(p) : ''];
  });
  download(`fomo-toan-truong-${A.cls || 'tat-ca'}.csv`, toCsv([head, ...rows]), 'text/csv');
}

registerActions({
  renderAdmin: () => renderAdmin(),
  adminSearch: ({ el }) => { A.q = el.value; drawUsers(); }, // chỉ vẽ lại bảng để ô tìm kiếm giữ con trỏ
  adminFilterRole: ({ el }) => { A.role = el.value as typeof A.role; A.selected = null; drawUsers(); },
  adminApprove: ({ arg }) => approve(arg),
  adminDelete: ({ arg }) => deleteAccount(arg),
  adminFilterClass: ({ el }) => { A.cls = el.value; A.selected = null; drawUsers(); },
  adminSelect: ({ arg }) => { A.selected = A.selected === arg ? null : arg; drawUsers(); },
  adminResetPassword: ({ arg }) => resetPassword(arg),
  adminPromote: ({ arg }) => setRole(arg, 'teacher'),
  adminDemote: ({ arg }) => setRole(arg, 'student'),
  adminAddClass: ({ el, arg }) => addClass(el, arg),
  adminRemoveClass: ({ el, arg }) => removeClass(arg, el.dataset.cls ?? ''),
  adminRotateTeacherCode: () => rotate('teacher'),
  adminRotateAdminCode: () => rotate('admin'),
  adminExportCsv: () => exportCsv(),
  adminExportResearch: () => exportResearch(),
});
