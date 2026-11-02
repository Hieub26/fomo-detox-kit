import { refresh } from '../shell/navigation';
import { $, pad, toast } from '../../lib/dom';
import { expose } from '../../lib/expose';
import { S, save } from '../../state/store';

export const REMIND_H = 21, REMIND_M = 30;

export let lastRem = 0;
export function tickCountdown() {
  const now = new Date(), t = new Date(now);
  t.setHours(REMIND_H, REMIND_M, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  const rem = t.getTime() - now.getTime();
  if (S.reminder && lastRem && rem > lastRem + 5000) fireReminder();
  lastRem = rem;
  const el = $('#countdownDisplay');
  if (el) { const s = Math.floor(rem / 1000); el.textContent = `${pad(Math.floor(s / 3600))} : ${pad(Math.floor(s % 3600 / 60))} : ${pad(s % 60)}`; }
}
setInterval(tickCountdown, 1000);
export function fireReminder() {
  toast('🌙 Đến giờ rời màn hình! Hãy tắt thiết bị để ngủ ngon.');
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification('FOMO DETOX KIT', { body: 'Đến giờ rời màn hình rồi. Chúc bạn ngủ ngon!' }); } catch (e) { /* bỏ qua */ }
}
export function toggleReminder() {
  S.reminder = !S.reminder; save();
  if (S.reminder) {
    toast('Đã bật nhắc nhở vào 21h30 mỗi tối (khi ứng dụng đang mở).');
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }
  refresh();
}

expose({ toggleReminder });
