import { $, esc, fmtDate, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { openModal, isModalOpen } from '../../lib/modal';
import { sb } from '../../lib/supabase';
import { Sync } from '../sync/sync';

interface Message { id: string; student_id: string; teacher_id: string; sender_id: string; body: string; created_at: string }

// Hội thoại tư vấn đang mở: một cặp (học sinh, giáo viên). Admin không tham gia.
// App không dùng Realtime (để giảm dung lượng JS), nên cửa sổ đang mở tải lại tin mới mỗi vài giây.
let convo: { studentId: string; teacherId: string; peer: string } | null = null;
let messages: Message[] = [];
let poll: number | undefined;
const POLL_MS = 4000;

const myId = () => Sync.uid;

async function fetchMessages() {
  if (!convo) return;
  const { data } = await sb.from('messages').select('*')
    .eq('student_id', convo.studentId).eq('teacher_id', convo.teacherId).order('created_at');
  if (!data || !convo) return;
  if (JSON.stringify(data) !== JSON.stringify(messages)) { messages = data as Message[]; renderMessages(); }
}
function renderMessages() {
  const box = $('#chatBox');
  if (!box) return;
  const atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 40;
  box.innerHTML = messages.length
    ? messages.map(m => {
      const mine = m.sender_id === myId();
      return `<div class="flex ${mine ? 'justify-end' : 'justify-start'}"><div class="max-w-[80%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-teal-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
        <p style="white-space:pre-wrap">${esc(m.body)}</p>
        <p class="text-[10px] mt-0.5 ${mine ? 'text-teal-100' : 'text-slate-400'}">${fmtDate(m.created_at)}</p></div></div>`;
    }).join('')
    : '<p class="text-sm text-slate-400 text-center py-8">Chưa có tin nhắn. Hãy gửi lời đầu tiên.</p>';
  if (atBottom) box.scrollTop = box.scrollHeight; // chỉ tự cuộn khi người dùng đang ở cuối
}
function chatHtml(peer: string) {
  return `<div class="flex flex-col" style="height:min(70vh,520px)">
    <h3 class="font-bold text-lg text-slate-800 mb-1 pr-8"><i class="fa-solid fa-comments text-teal-600 mr-1"></i> ${esc(peer)}</h3>
    <p class="text-xs text-slate-500 mb-3">Trò chuyện riêng tư. Chỉ bạn và ${esc(peer)} đọc được.</p>
    <div id="chatBox" class="flex-1 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200"></div>
    <div class="flex gap-2 mt-3">
      <textarea id="chatInput" rows="1" maxlength="2000" placeholder="Nhập tin nhắn..." class="flex-1 min-w-0 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
      <button data-click="chatSend" aria-label="Gửi" class="px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shrink-0"><i class="fa-solid fa-paper-plane"></i></button>
    </div></div>`;
}

// Học sinh mở tư vấn: chọn giáo viên của lớp mình (một hoặc nhiều).
let teacherList: { id: string; full_name: string; username: string }[] = [];
export async function studentStartChat() {
  const { data, error } = await sb.rpc('my_teachers');
  if (error) { toast('Không tải được danh sách giáo viên.'); return; }
  teacherList = (data || []) as typeof teacherList;
  if (!teacherList.length) { toast('Lớp của bạn chưa có giáo viên phụ trách để nhắn tin.'); return; }
  if (teacherList.length === 1) { const t = teacherList[0]; openChat(myId()!, t.id, t.full_name || t.username); return; }
  openModal(`<h3 class="font-bold text-lg text-slate-800 mb-3 pr-8">Chọn giáo viên để nhắn tin</h3>
    <div class="space-y-2">${teacherList.map(t => `<button data-click="chatWithTeacher" data-arg="${esc(t.id)}" class="w-full text-left px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-semibold text-slate-800"><i class="fa-solid fa-user-tie text-teal-600 mr-2"></i>${esc(t.full_name || t.username)}</button>`).join('')}</div>`);
}
// Giáo viên mở tư vấn với một học sinh cụ thể.
export function teacherStartChat(studentId: string, name: string) { openChat(studentId, myId()!, name); }

export async function openChat(studentId: string, teacherId: string, peer: string) {
  convo = { studentId, teacherId, peer };
  messages = [];
  openModal(chatHtml(peer));
  await fetchMessages();
  clearInterval(poll);
  poll = setInterval(fetchMessages, POLL_MS) as unknown as number;
}
export function closeChat() {
  clearInterval(poll); poll = undefined;
  convo = null;
}
async function chatSend() {
  const input = $('#chatInput'), body = input.value.trim();
  if (!body || !convo) return;
  input.value = '';
  const row = { student_id: convo.studentId, teacher_id: convo.teacherId, sender_id: myId()!, body };
  const { data, error } = await sb.from('messages').insert(row).select().single();
  if (error) { toast('Không gửi được tin nhắn.'); input.value = body; return; }
  if (data && !messages.some(x => x.id === (data as Message).id)) { messages.push(data as Message); renderMessages(); }
}

// Đóng hội thoại (dừng tải lại) khi cửa sổ đóng bằng bất kỳ cách nào (X, nền, Esc).
document.addEventListener('click', () => { if (convo && !isModalOpen()) closeChat(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && convo) setTimeout(() => { if (!isModalOpen()) closeChat(); }, 0); });

registerActions({
  chatSend: () => chatSend(),
  studentStartChat: () => studentStartChat(),
  chatWithTeacher: ({ arg }) => { const t = teacherList.find(x => x.id === arg); if (t) openChat(myId()!, t.id, t.full_name || t.username); },
});
