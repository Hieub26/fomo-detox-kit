import { $, esc, fmtDate, toast } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { openModal, isModalOpen } from '../../lib/modal';
import { sb } from '../../lib/supabase';
import { Sync } from '../sync/sync';
import { S } from '../../state/store';

interface Message { id: string; student_id: string; teacher_id: string; sender_id: string; body: string; created_at: string }
interface Conversation { student_id: string; teacher_id: string; peer_id: string; peer_name: string; last_body: string; last_at: string; last_sender: string }

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
  markConvoRead(convo.studentId, convo.teacherId); // cửa sổ đang mở: tin tới coi như đã đọc
  refreshBadge();
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
  markConvoRead(studentId, teacherId); // mở hội thoại thì coi như đã đọc tới tin mới nhất
  refreshBadge();
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

// ---- Bong bóng chat nổi + theo dõi tin nhắn đến ----
// App không dùng Realtime, nên một vòng lặp nhẹ hỏi máy chủ mỗi WATCH_MS giây để phát hiện tin mới,
// hiện huy hiệu số hội thoại chưa đọc và báo toast khi có tin đến từ người khác.
const WATCH_MS = 15000;
const READ_KEY = 'fomo_chat_read';
let conversations: Conversation[] = [];
let watch: number | undefined;

const convoKey = (studentId: string, teacherId: string) => `${studentId}:${teacherId}`;
function readMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}') as Record<string, string>; } catch { return {}; }
}
function markConvoRead(studentId: string, teacherId: string, at?: string) {
  const map = readMap();
  map[convoKey(studentId, teacherId)] = at || new Date().toISOString();
  try { localStorage.setItem(READ_KEY, JSON.stringify(map)); } catch { /* bỏ qua */ }
}
// Hội thoại chưa đọc: tin cuối do người khác gửi và mới hơn mốc đã đọc đã lưu.
function isUnread(c: Conversation, map: Record<string, string>): boolean {
  if (c.last_sender === myId()) return false;
  const seen = map[convoKey(c.student_id, c.teacher_id)];
  return !seen || c.last_at > seen;
}
function unreadCount(): number {
  const map = readMap();
  return conversations.filter(c => isUnread(c, map)).length;
}
function refreshBadge() {
  const badge = $('#chatBadge');
  if (!badge) return;
  const n = unreadCount();
  badge.textContent = n > 9 ? '9+' : String(n);
  badge.classList.toggle('hidden', n === 0);
}
function mountBubble() {
  if (document.getElementById('chatBubble')) return;
  const b = document.createElement('button');
  b.id = 'chatBubble';
  b.dataset.click = 'openConvoList';
  b.setAttribute('aria-label', 'Tin nhắn tư vấn');
  b.className = 'fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-14 h-14 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg flex items-center justify-center';
  b.innerHTML = `<i class="fa-solid fa-comments text-xl"></i>
    <span id="chatBadge" class="hidden absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-xs font-bold flex items-center justify-center"></span>`;
  document.getElementById('appShell')?.appendChild(b);
}
async function pollConversations() {
  const { data } = await sb.rpc('my_conversations');
  if (!data) return;
  const prev = conversations;
  const map = readMap();
  conversations = data as Conversation[];
  // Báo toast cho tin đến mới (người khác gửi, mới hơn lần thấy trước và mốc đã đọc), trừ hội thoại đang mở.
  for (const c of conversations) {
    if (!isUnread(c, map)) continue;
    const open = convo && convo.studentId === c.student_id && convo.teacherId === c.teacher_id;
    if (open) continue;
    const before = prev.find(p => p.student_id === c.student_id && p.teacher_id === c.teacher_id);
    if (!before || c.last_at > before.last_at) toast(`Tin nhắn mới từ ${c.peer_name}`);
  }
  refreshBadge();
}
export function startChatWatch() {
  const role = S.profile?.role;
  if (role !== 'student' && role !== 'teacher') return; // admin không tham gia hội thoại
  mountBubble();
  clearInterval(watch);
  pollConversations();
  watch = setInterval(pollConversations, WATCH_MS) as unknown as number;
}
export function stopChatWatch() {
  clearInterval(watch); watch = undefined;
  document.getElementById('chatBubble')?.remove();
}
// Danh sách hội thoại: tên người, tin cuối, chấm chưa đọc. Học sinh có thêm lối nhắn giáo viên mới.
function openConvoList() {
  const map = readMap();
  const role = S.profile?.role;
  const rows = conversations.length
    ? conversations.map(c => {
      const unread = isUnread(c, map);
      return `<button data-click="openConvo" data-arg="${esc(convoKey(c.student_id, c.teacher_id))}" class="w-full text-left px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-3">
        <span class="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center shrink-0"><i class="fa-solid fa-user"></i></span>
        <span class="flex-1 min-w-0">
          <span class="flex items-center gap-2"><span class="font-semibold text-slate-800 truncate">${esc(c.peer_name)}</span>${unread ? '<span class="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>' : ''}</span>
          <span class="block text-xs text-slate-500 truncate">${c.last_sender === myId() ? 'Bạn: ' : ''}${esc(c.last_body)}</span>
        </span>
        <span class="text-[10px] text-slate-400 shrink-0">${fmtDate(c.last_at)}</span></button>`;
    }).join('')
    : '<p class="text-sm text-slate-400 text-center py-8">Chưa có hội thoại nào.</p>';
  openModal(`<h3 class="font-bold text-lg text-slate-800 mb-3 pr-8"><i class="fa-solid fa-comments text-teal-600 mr-1"></i> Tin nhắn tư vấn</h3>
    <div class="space-y-2">${rows}</div>
    ${role === 'student' ? '<button data-click="studentStartChat" class="mt-3 w-full px-4 py-3 border border-dashed border-teal-400 rounded-xl text-teal-700 font-semibold hover:bg-teal-50"><i class="fa-solid fa-plus mr-1"></i> Nhắn giáo viên mới</button>' : ''}`);
}
function openConvoFromList(key: string) {
  const c = conversations.find(x => convoKey(x.student_id, x.teacher_id) === key);
  if (c) openChat(c.student_id, c.teacher_id, c.peer_name);
}

registerActions({
  chatSend: () => chatSend(),
  studentStartChat: () => studentStartChat(),
  chatWithTeacher: ({ arg }) => { const t = teacherList.find(x => x.id === arg); if (t) openChat(myId()!, t.id, t.full_name || t.username); },
  openConvoList: () => openConvoList(),
  openConvo: ({ arg }) => openConvoFromList(arg),
});
