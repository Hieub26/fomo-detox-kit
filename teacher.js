'use strict';
/* Màn hình giáo viên: xem kết quả của các lớp mình phụ trách. Quyền xem do RLS trên máy chủ quyết định. */

const T = { classes: [], students: [], assess: {}, programs: {}, filter: '', selected: null, tempPass: null, error: '' };

async function loadTeacherData() {
  const { data: cls, error: e1 } = await sb.from('teacher_classes').select('class_name').eq('teacher_id', Sync.uid).order('class_name');
  if (e1) throw e1;
  T.classes = cls.map(c => c.class_name);
  const profiles = await fetchAllRows(sb.from('profiles').select('id,username,full_name,class_name').eq('role', 'student').order('class_name').order('full_name'));
  T.students = profiles;
  const ids = new Set(profiles.map(p => p.id));
  const group = (rows, convert) => {
    const out = {};
    rows.forEach(r => { if (ids.has(r.user_id)) (out[r.user_id] = out[r.user_id] || []).push(convert(r)); });
    return out;
  };
  T.assess = group(await fetchAllRows(sb.from('assessments').select('*').order('user_id').order('id')), TABLES.assessments.fromRow);
  T.programs = group(await fetchAllRows(sb.from('programs').select('*').order('user_id').order('id')), TABLES.programs.fromRow);
  Object.values(T.assess).forEach(l => l.sort(byDate));
}

function studentSummary(s) {
  const as = T.assess[s.id] || [], ps = T.programs[s.id] || [];
  const first = as[0], last = as[as.length - 1], p = ps[ps.length - 1];
  return {
    s, count: as.length, first, last,
    change: as.length > 1 ? last.score - first.score : null,
    program: p || null, percent: p ? pct(p) : null
  };
}

function render7() {
  const box = $('#module-7');
  box.innerHTML = '<p class="text-center text-slate-500 py-16"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu lớp...</p>';
  loadTeacherData().then(() => { T.error = ''; drawTeacher(); }).catch(e => {
    console.error(e);
    T.error = 'Không tải được dữ liệu lớp. Hãy kiểm tra mạng rồi thử lại.';
    drawTeacher();
  });
}

function drawTeacher() {
  if (tab !== 7) return;
  const rows = T.students.filter(s => !T.filter || s.class_name === T.filter).map(studentSummary);
  const done = rows.filter(r => r.count);
  const high = done.filter(r => levelIdx(r.last.score) === 2).length;
  const changed = rows.filter(r => r.change !== null);
  const avg = changed.length ? (changed.reduce((a, r) => a + r.change, 0) / changed.length).toFixed(1) : '–';
  const tile = (label, value, note) => `<div class="${card} !p-4"><div class="text-xs text-slate-500">${label}</div><div class="text-2xl font-black text-slate-800 mt-1">${value}</div>${note ? `<div class="text-[11px] text-slate-400 mt-0.5">${note}</div>` : ''}</div>`;

  $('#module-7').innerHTML = `
    ${T.error ? `<div class="text-sm rounded-xl px-3 py-2 bg-rose-50 text-rose-800 border border-rose-200">${esc(T.error)}</div>` : ''}
    <div class="${card}">
      <h2 class="font-bold text-xl text-slate-800 mb-1"><i class="fa-solid fa-chalkboard-user text-teal-600 mr-1"></i> Lớp Của Tôi</h2>
      <p class="text-xs text-slate-500 mb-3">Thêm tên lớp bạn phụ trách. Học sinh đăng ký đúng tên lớp sẽ hiện bên dưới. Giáo viên không xem được Góc Ẩn Danh.</p>
      <div class="flex flex-wrap gap-2 items-center mb-3">${T.classes.length ? T.classes.map(c => `
        <span class="flex items-center gap-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold pl-3 pr-1 py-1 rounded-full">${esc(c)}
          <button onclick="removeClass(this.dataset.c)" data-c="${esc(c)}" aria-label="Bỏ lớp ${esc(c)}" class="w-6 h-6 rounded-full hover:bg-teal-100"><i class="fa-solid fa-xmark"></i></button></span>`).join('') : '<span class="text-sm text-slate-400">Chưa có lớp nào.</span>'}</div>
      <form onsubmit="addClass(event)" class="flex gap-2 max-w-sm">
        <input id="newClass" maxlength="20" placeholder="Ví dụ: 8A2" aria-label="Tên lớp mới" class="${inp}">
        <button class="${bt} bg-teal-600 hover:bg-teal-700 whitespace-nowrap">Thêm lớp</button></form>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      ${tile('Học sinh', rows.length)}
      ${tile('Đã làm trắc nghiệm', done.length)}
      ${tile('Đang ở mức Cao', high, 'theo lần gần nhất')}
      ${tile('Thay đổi điểm trung bình', avg, 'học sinh có từ 2 lần, âm là tốt hơn')}
    </div>
    <div class="${card}">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 class="font-bold text-lg text-slate-800">Kết Quả Học Sinh</h3>
        <div class="flex gap-2 items-center">
          <select onchange="T.filter=this.value;T.selected=null;drawTeacher()" aria-label="Lọc theo lớp" class="border border-slate-200 rounded-lg px-2 py-1.5 text-sm">
            <option value="">Tất cả lớp</option>${T.classes.map(c => `<option value="${esc(c)}" ${T.filter === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
          <button onclick="exportClassCsv()" class="${bt} bg-indigo-600 hover:bg-indigo-700 !py-1.5">Xuất CSV</button>
          <button onclick="render7()" aria-label="Tải lại" title="Tải lại" class="w-9 h-9 border border-slate-200 rounded-lg hover:bg-slate-50"><i class="fa-solid fa-rotate-right text-slate-500"></i></button>
        </div>
      </div>
      ${rows.length ? `<div class="overflow-x-auto custom-scrollbar"><table class="w-full text-sm text-left whitespace-nowrap">
        <tr class="text-xs text-slate-500"><th class="py-2 pr-3">Họ tên</th><th class="pr-3">Lớp</th><th class="pr-3">Số lần</th><th class="pr-3">Đầu</th><th class="pr-3">Gần nhất</th><th class="pr-3">Đổi</th><th class="pr-3">Mức</th><th class="pr-3">Lộ trình</th><th></th></tr>
        ${rows.map(r => `<tr class="border-t border-slate-100 ${T.selected === r.s.id ? 'bg-teal-50/60' : ''}">
          <td class="py-2 pr-3"><div class="font-semibold text-slate-800">${esc(r.s.full_name || r.s.username)}</div><div class="text-[11px] text-slate-400">${esc(r.s.username)}</div></td>
          <td class="pr-3">${esc(r.s.class_name || '')}</td><td class="pr-3">${r.count}</td>
          <td class="pr-3">${r.first ? r.first.score : '–'}</td><td class="pr-3 font-semibold">${r.last ? r.last.score : '–'}</td>
          <td class="pr-3 font-semibold ${r.change < 0 ? 'text-emerald-600' : r.change > 0 ? 'text-rose-600' : ''}">${r.change === null ? '–' : r.change > 0 ? '+' + r.change : r.change}</td>
          <td class="pr-3">${r.last ? lvBadge(r.last.score) : '–'}</td>
          <td class="pr-3">${r.program ? `${r.program.days} ngày • ${r.percent}%` : '–'}</td>
          <td class="text-right"><button onclick="selectStudent('${r.s.id}')" class="px-2.5 py-1 border border-slate-200 rounded-lg text-xs hover:bg-slate-50">Chi tiết</button></td></tr>`).join('')}
      </table></div>` : `<p class="text-sm text-slate-500">${T.classes.length ? 'Chưa có học sinh nào đăng ký vào lớp này.' : 'Thêm lớp để xem học sinh.'}</p>`}
    </div>
    ${studentDetail()}`;
}

function studentDetail() {
  const s = T.students.find(x => x.id === T.selected);
  if (!s) return '';
  const as = T.assess[s.id] || [], ps = T.programs[s.id] || [];
  const progs = ps.slice().reverse().map(p => {
    const pre = as.find(a => a.id === p.preId), post = as.find(a => a.id === p.postId);
    const st = p.status === 'active' ? 'đang thực hiện' : p.status === 'done' ? 'đã xong' : 'đã dừng';
    return `<div class="mt-3 p-4 border border-slate-200 rounded-xl"><h4 class="font-bold text-sm">Lộ trình ${p.days} ngày • ${fmtDate(p.start)}</h4>
      <p class="text-xs text-slate-500 mb-2">Hoàn thành ${checkedCount(p)}/${p.days} ngày (${pct(p)}%) • ${st}</p>
      ${pre && post ? compareHtml(pre, post) : '<p class="text-xs text-slate-500">Chưa đủ khảo sát trước và sau để so sánh.</p>'}</div>`;
  }).join('');
  return `<div class="${card}">
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h3 class="font-bold text-lg text-slate-800">${esc(s.full_name || s.username)} <span class="text-xs font-normal text-slate-500">(${esc(s.username)} • ${esc(s.class_name || '')})</span></h3>
      <button onclick="resetStudentPassword('${s.id}')" class="${bt} bg-slate-700 hover:bg-slate-800 !py-1.5"><i class="fa-solid fa-key mr-1"></i> Đặt lại mật khẩu</button>
    </div>
    ${T.tempPass && T.tempPass.id === s.id ? `<div class="mt-3 text-sm rounded-xl px-3 py-2 bg-amber-50 text-amber-900 border border-amber-200">Mật khẩu mới: <code class="font-bold select-all">${esc(T.tempPass.value)}</code>. Hãy đưa riêng cho học sinh và nhắc đổi lại ở mục Hồ sơ. Mật khẩu chỉ hiện một lần.</div>` : ''}
    ${as.length ? `<div class="max-w-xl mt-3">${lineChart(as)}</div>
      <div class="overflow-x-auto mt-2"><table class="w-full text-sm text-left"><tr class="text-xs text-slate-500"><th class="py-1">Ngày</th><th>Loại</th><th>Điểm</th><th>Mức</th></tr>
      ${as.slice().reverse().map(a => `<tr class="border-t border-slate-100"><td class="py-1.5">${fmtDate(a.date)}</td><td>${esc(a.kind)}</td><td class="font-semibold">${a.score}/${MAXSCORE}</td><td>${lvBadge(a.score)}</td></tr>`).join('')}</table></div>` : '<p class="text-sm text-slate-500 mt-2">Học sinh chưa làm trắc nghiệm.</p>'}
    ${progs}</div>`;
}

function selectStudent(id) { T.selected = T.selected === id ? null : id; T.tempPass = null; drawTeacher(); }

async function addClass(e) {
  e.preventDefault();
  const name = $('#newClass').value.trim();
  if (!name) return;
  const { error } = await sb.from('teacher_classes').insert({ teacher_id: Sync.uid, class_name: name });
  if (error && error.code !== '23505') { console.error(error); toast('Không thêm được lớp. Hãy thử lại.'); return; }
  render7();
}
async function removeClass(name) {
  if (!confirm(`Bỏ lớp ${name} khỏi danh sách của bạn? Dữ liệu học sinh không bị xóa.`)) return;
  const { error } = await sb.from('teacher_classes').delete().eq('teacher_id', Sync.uid).eq('class_name', name);
  if (error) { console.error(error); toast('Không bỏ được lớp. Hãy thử lại.'); return; }
  if (T.filter === name) T.filter = '';
  T.selected = null;
  render7();
}
function randomPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // bỏ ký tự dễ nhầm: i, l, o, 0, 1
  const limit = 256 - (256 % chars.length); // loại giá trị lệch để mỗi ký tự có xác suất như nhau
  let out = '';
  while (out.length < 10) {
    const b = crypto.getRandomValues(new Uint8Array(1))[0];
    if (b < limit) out += chars[b % chars.length];
  }
  return out;
}
async function resetStudentPassword(id) {
  const s = T.students.find(x => x.id === id);
  if (!s || !confirm(`Đặt lại mật khẩu cho ${s.full_name || s.username}? Học sinh sẽ bị đăng xuất khỏi mọi thiết bị.`)) return;
  const value = randomPassword();
  const { error } = await sb.rpc('teacher_reset_password', { target: id, new_password: value });
  if (error) { console.error(error); toast('Không đặt lại được mật khẩu.'); return; }
  T.tempPass = { id, value };
  drawTeacher();
}
function exportClassCsv() {
  const head = ['ten_dang_nhap', 'ho_ten', 'lop', 'so_lan', 'diem_dau', 'diem_gan_nhat', 'thay_doi', 'muc', 'lo_trinh_ngay', 'phan_tram_hoan_thanh'];
  const rows = T.students.filter(s => !T.filter || s.class_name === T.filter).map(studentSummary).map(r => [
    r.s.username, r.s.full_name, r.s.class_name, r.count, r.first ? r.first.score : '', r.last ? r.last.score : '',
    r.change === null ? '' : r.change, r.last ? LEVELS[levelIdx(r.last.score)].short : '', r.program ? r.program.days : '', r.percent === null ? '' : r.percent
  ]);
  download(`fomo-lop-${T.filter || 'tat-ca'}.csv`, toCsv([head, ...rows]), 'text/csv');
}
RENDER[7] = render7;
