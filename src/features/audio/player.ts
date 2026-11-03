import { $, card, toast, uid } from '../../lib/dom';
import { registerActions } from '../../lib/actions';
import { S, save } from '../../state/store';

export const SOUNDS: Record<string, { name: string; desc: string; icon: string }> = {
  alpha: { name: 'Sóng Alpha (10Hz)', desc: 'Nhịp phách 10Hz, có thể giúp thư giãn sau giờ học', icon: 'fa-brain' },
  theta: { name: 'Sóng Theta (6Hz)', desc: 'Nhịp phách 6Hz, có thể giúp thư giãn trước khi ngủ', icon: 'fa-bed' },
  delta: { name: 'Sóng Delta (3Hz)', desc: 'Nhịp phách 3Hz, có thể giúp dễ vào giấc hơn', icon: 'fa-moon' },
  rain: { name: 'Mưa Nhẹ (Pink Noise)', desc: 'Tiếng mưa êm, che bớt các tiếng ồn gây xao nhãng', icon: 'fa-cloud-showers-heavy' },
  ocean: { name: 'Sóng Biển Dịu Êm (Pink Noise)', desc: 'Tần số nhịp nhàng dịu êm, nhấp nhô như sóng vỗ', icon: 'fa-water' },
  lofi: { name: 'Giai Điệu Thiền Nhẹ Nhàng', desc: 'Nhịp điệu chậm rãi, nhẹ nhàng', icon: 'fa-music' }
};

export const AU = { ctx: null as AudioContext | null, master: null as GainNode | null, nodes: [] as AudioScheduledSourceNode[], key: null as string | null, playing: false, vol: 0.5, timerMin: 0, timer: undefined as number | undefined, endAt: 0, startedAt: 0 };
export function noiseBuffer(ctx: AudioContext, kind: string) {
  const n = ctx.sampleRate * 3, buf = ctx.createBuffer(1, n, ctx.sampleRate), o = buf.getChannelData(0);
  if (kind === 'white') { for (let i = 0; i < n; i++) o[i] = Math.random() * 2 - 1; }
  else { // pink noise (Paul Kellet)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
      b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
      o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
    }
  }
  return buf;
}
export function buildSound(ctx: AudioContext, out: AudioNode, key: string) {
  const add = <N extends AudioScheduledSourceNode>(n: N) => { AU.nodes.push(n); return n; };
  const osc = (type: OscillatorType, f: number, dest: AudioNode | null, pan?: number) => {
    const o = add(ctx.createOscillator()); o.type = type; o.frequency.value = f;
    if (!dest) { /* dao động điều biến (LFO), nối thủ công */ }
    else if (pan != null) { const p = ctx.createStereoPanner(); p.pan.value = pan; o.connect(p); p.connect(dest); } else o.connect(dest);
    o.start(); return o;
  };
  const noise = (kind: string, dest: AudioNode) => { const s = add(ctx.createBufferSource()); s.buffer = noiseBuffer(ctx, kind); s.loop = true; s.connect(dest); s.start(); return s; };
  if (key === 'alpha') { osc('sine', 200, out, -1); osc('sine', 210, out, 1); }
  else if (key === 'theta') { osc('sine', 120, out, -1); osc('sine', 126, out, 1); }
  else if (key === 'delta') { osc('sine', 150, out, -1); osc('sine', 153, out, 1); }
  else if (key === 'rain') {
    // Pink noise cắt bớt âm cao để không chói; vẫn giữ dải 200–2200 Hz nên nghe khác tiếng sóng biển trầm hơn.
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    hp.connect(lp); lp.connect(out); noise('pink', hp);
  } else if (key === 'ocean') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const swell = ctx.createGain(); swell.gain.value = .6;
    const lfo = osc('sine', .1, null);
    const depth = ctx.createGain(); depth.gain.value = .4; lfo.connect(depth); depth.connect(swell.gain);
    lp.connect(swell); swell.connect(out); noise('pink', lp);
  } else if (key === 'lofi') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.connect(out);
    const pad = ctx.createGain(); pad.gain.value = .35; pad.connect(lp);
    [130.81, 164.81, 196, 246.94].forEach((f, i) => {
      const o = osc('triangle', f, pad), l = osc('sine', .07 + i * .03, null);
      const d = ctx.createGain(); d.gain.value = 8; l.connect(d); d.connect(o.detune);
    });
  }
}
export function selectSound(key: string) {
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) { toast('Trình duyệt không hỗ trợ phát âm thanh.'); return; }
  stopSound(true);
  if (!AU.ctx) AU.ctx = new AC();
  const ctx = AU.ctx; ctx.resume();
  AU.master = ctx.createGain(); AU.master.gain.value = 0; AU.master.connect(ctx.destination);
  buildSound(ctx, AU.master, key);
  AU.master.gain.linearRampToValueAtTime(AU.vol, ctx.currentTime + 2);
  Object.assign(AU, { key, playing: true, startedAt: Date.now() });
  setAudioTimer(true);
  renderPlayer();
}
export function stopSound(silent?: boolean) {
  if (!AU.key) return;
  const sec = Math.round((Date.now() - AU.startedAt) / 1000);
  if (sec >= 30) { S.audio.push({ id: uid(), date: new Date().toISOString(), sound: AU.key, seconds: Math.min(sec, 86400) }); save(); }
  const ctx = AU.ctx!, nodes = AU.nodes, m = AU.master!;
  try { m.gain.cancelScheduledValues(ctx.currentTime); m.gain.setValueAtTime(m.gain.value, ctx.currentTime); m.gain.linearRampToValueAtTime(0, ctx.currentTime + .4); } catch (e) { /* bỏ qua */ }
  setTimeout(() => { nodes.forEach(n => { try { n.stop(); } catch (e) { /* bỏ qua */ } }); try { m.disconnect(); } catch (e) { /* bỏ qua */ } }, 500);
  clearTimeout(AU.timer);
  Object.assign(AU, { nodes: [], key: null, playing: false, master: null, endAt: 0 });
  if (!silent) renderPlayer();
}
export function toggleAudioPlay() {
  if (!AU.key) { selectSound('alpha'); return; }
  if (AU.playing) { AU.ctx!.suspend(); AU.playing = false; } else { AU.ctx!.resume(); AU.playing = true; }
  renderPlayer();
}
export function changeVolume(v: string) {
  AU.vol = parseFloat(v);
  if (AU.master) AU.master.gain.value = AU.vol;
}
export function setAudioTimer(keep?: boolean) {
  const sel = $('#sleepTimerSelect');
  if (!keep && sel) AU.timerMin = parseInt(sel.value);
  clearTimeout(AU.timer);
  if (AU.timerMin > 0 && AU.key) {
    AU.endAt = Date.now() + AU.timerMin * 60000;
    AU.timer = setTimeout(() => { stopSound(); toast(`Đã hết ${AU.timerMin} phút hẹn giờ. Âm thanh tự động tắt để bạn ngủ ngon!`); }, AU.timerMin * 60000);
  } else AU.endAt = 0;
}
export function renderPlayer() {
  const s = AU.key ? SOUNDS[AU.key] : null;
  const w = $('#playerWrap'); if (!w) return;
  w.classList.toggle('paused', !AU.playing);
  $('#currentAudioIcon').className = `fa-solid ${s ? s.icon : 'fa-water'} text-3xl text-white`;
  $('#currentAudioTitle').textContent = s ? s.name : 'Chưa chọn âm thanh';
  $('#currentAudioDesc').textContent = s ? s.desc : 'Nhấn vào danh sách bên dưới để bắt đầu phát';
  $('#playPauseBtn').innerHTML = AU.playing ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play ml-1"></i>';
}
export function render4() {
  const total = Math.round(S.audio.reduce((a, b) => a + b.seconds, 0) / 60);
  const lib: string[][] = [['alpha', 'teal', 'Thư giãn não bộ sau giờ học'], ['theta', 'indigo', 'Thư giãn trước khi ngủ'], ['delta', 'violet', 'Hỗ trợ dễ vào giấc'], ['rain', 'sky', 'Xoa dịu tiếng ồn xung quanh'], ['ocean', 'emerald', 'Tần số nhịp nhàng dịu êm'], ['lofi', 'amber', 'Giai điệu chậm dưới 60BPM']];
  const LC: Record<string, string> = {
    teal: 'hover:border-teal-500 hover:bg-teal-50/50|bg-teal-100 text-teal-600', indigo: 'hover:border-indigo-500 hover:bg-indigo-50/50|bg-indigo-100 text-indigo-600', violet: 'hover:border-violet-500 hover:bg-violet-50/50|bg-violet-100 text-violet-600',
    sky: 'hover:border-sky-500 hover:bg-sky-50/50|bg-sky-100 text-sky-600', emerald: 'hover:border-emerald-500 hover:bg-emerald-50/50|bg-emerald-100 text-emerald-600',
    amber: 'hover:border-amber-500 hover:bg-amber-50/50|bg-amber-100 text-amber-600'
  };
  $('#module-4').innerHTML = `<div class="${card} sm:p-8">
    <div class="max-w-3xl mx-auto text-center">
      <span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full uppercase">Âm Thanh Thư Giãn</span>
      <h2 class="text-2xl font-bold text-slate-800 mt-2">Trình Phát Âm Thanh Thư Giãn</h2>
      <p class="text-slate-500 text-sm mt-1">Âm thanh nhịp phách (binaural beats) Alpha/Theta/Delta và tiếng ồn nền có thể giúp một số bạn thư giãn, dễ ngủ hơn. Bằng chứng khoa học về nhịp phách còn hạn chế và hiệu quả khác nhau ở mỗi người. Đeo tai nghe hai bên để nghe nhịp phách.</p>
    </div>
    <div id="playerWrap" class="max-w-2xl mx-auto mt-8 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"><div class="flex flex-col items-center text-center">
      <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center pulse-animation mb-4 shadow-lg shadow-teal-500/20"><i id="currentAudioIcon" class="fa-solid fa-water text-3xl text-white"></i></div>
      <h3 id="currentAudioTitle" class="text-xl font-bold text-white"></h3><p id="currentAudioDesc" class="text-xs text-slate-400 mt-1"></p>
      <div class="flex items-center gap-6 my-6"><button data-click="toggleAudioPlay" id="playPauseBtn" aria-label="Phát hoặc tạm dừng" class="w-16 h-16 bg-teal-500 hover:bg-teal-400 text-slate-900 rounded-full flex items-center justify-center text-2xl font-bold transition shadow-lg"></button>
        <button data-click="stopSound" aria-label="Dừng" class="w-11 h-11 bg-slate-700 hover:bg-slate-600 rounded-full text-sm"><i class="fa-solid fa-stop"></i></button></div>
      <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
        <div class="flex items-center justify-center gap-2"><i class="fa-solid fa-clock text-teal-400"></i><span>Hẹn giờ tắt:</span>
          <select id="sleepTimerSelect" data-change="setAudioTimer" class="bg-slate-800 text-white rounded border border-slate-700 px-2 py-1">${[[0, 'Tắt hẹn giờ'], [15, '15 phút'], [30, '30 phút'], [45, '45 phút']].map(o => `<option value="${o[0]}" ${AU.timerMin === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
        <div class="flex items-center justify-center gap-2"><i class="fa-solid fa-volume-high text-teal-400"></i><span>Âm lượng:</span>
          <input type="range" min="0" max="1" step="0.05" value="${AU.vol}" data-input="changeVolume" class="w-24 accent-teal-500"></div>
      </div></div></div>
    <div class="max-w-3xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">${lib.map(l => {
      const c = LC[l[1]].split('|'), s = SOUNDS[l[0]];
      return `<button data-click="selectSound" data-arg="${l[0]}" class="p-4 rounded-xl border border-slate-200 ${c[0]} text-left transition flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg ${c[1]} flex items-center justify-center text-lg shrink-0"><i class="fa-solid ${s.icon}"></i></div>
        <div><h4 class="font-bold text-sm text-slate-800">${s.name}</h4><p class="text-xs text-slate-500">${l[2]}</p></div></button>`;
    }).join('')}</div>
    <p class="text-center text-xs text-slate-400 mt-6">Đã nghe ${S.audio.length} lần • ${total} phút. Âm thanh chỉ hỗ trợ thư giãn, không thay thế điều trị.</p>
  </div>`;
  renderPlayer();
}

registerActions({
  changeVolume: ({ el }) => changeVolume(el.value),
  selectSound: ({ arg }) => selectSound(arg),
  setAudioTimer: () => setAudioTimer(),
  stopSound: () => stopSound(),
  toggleAudioPlay: () => toggleAudioPlay(),
});
