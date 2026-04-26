
// ── DATA ──────────────────────────────────────────────
const COLORS = [
  { bg: '#F3F0FF', stripe: '#7C6FF7', text: '#7C6FF7' },
  { bg: '#FFF0F7', stripe: '#FF7EB3', text: '#E05A96' },
  { bg: '#FFF6E8', stripe: '#FFB347', text: '#CC8000' },
  { bg: '#EAFAF5', stripe: '#4DD9AC', text: '#1A9E75' },
  { bg: '#EBF8FE', stripe: '#56CCF2', text: '#1A9EC2' },
  { bg: '#FFF0F0', stripe: '#F27171', text: '#C94040' },
  { bg: '#F0FFF4', stripe: '#56D86E', text: '#1E8C38' },
  { bg: '#FDF4FF', stripe: '#C97EF7', text: '#9A3DCC' },
];
 
const DOT_COLORS = [
  '#7C6FF7', '#FF7EB3', '#FFB347', '#4DD9AC',
  '#56CCF2', '#F27171', '#56D86E', '#C97EF7'
];
 
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday'
};
 
// ── STATE ─────────────────────────────────────────────
let sessions = JSON.parse(localStorage.getItem('tt_sessions') || '[]');
let activeDay = 'Mon';
let selColor = 0;
 
// ── SAVE ──────────────────────────────────────────────
function save() {
  try { localStorage.setItem('tt_sessions', JSON.stringify(sessions)); } catch (e) {}
}
 
// ── COLOR PICKER ──────────────────────────────────────
function buildColorPicker() {
  document.getElementById('colorPicker').innerHTML = DOT_COLORS.map((c, i) =>
    `<div class="color-dot${i === selColor ? ' active' : ''}"
          style="background:${c}"
          onclick="pickColor(${i})"
          title="Color ${i + 1}"></div>`
  ).join('');
}
 
function pickColor(i) {
  selColor = i;
  buildColorPicker();
}
 
// ── DAY TABS ──────────────────────────────────────────
document.getElementById('dayTabs').addEventListener('click', e => {
  const tab = e.target.closest('.day-tab');
  if (!tab) return;
  document.querySelectorAll('.day-tab').forEach(d => d.classList.remove('active'));
  tab.classList.add('active');
  activeDay = tab.dataset.day;
  document.getElementById('viewDaySelect').value = activeDay;
  renderSessions();
});
 
// ── ADD SESSION ───────────────────────────────────────
function addSession() {
  const subj = document.getElementById('inp-subject').value.trim();
  const time = document.getElementById('inp-time').value;
  const dur  = parseInt(document.getElementById('inp-dur').value);
  const goal = document.getElementById('inp-goal').value.trim();
 
  if (!subj) { showToast('Please enter a subject!'); document.getElementById('inp-subject').focus(); return; }
  if (!time) { showToast('Please set a start time!'); document.getElementById('inp-time').focus(); return; }
 
  const col = COLORS[selColor];
  sessions.push({ id: Date.now() + Math.random(), day: activeDay, subj, time, dur, goal, col });
  sessions.sort((a, b) => a.day === b.day ? a.time.localeCompare(b.time) : 0);
  save();
 
  // Clear inputs
  document.getElementById('inp-subject').value = '';
  document.getElementById('inp-goal').value    = '';
  document.getElementById('inp-time').value    = '';
  document.getElementById('viewDaySelect').value = activeDay;
 
  renderSessions();
  showToast('Session added!');
}
 
// ── DELETE SESSION ────────────────────────────────────
function delSession(id) {
  sessions = sessions.filter(s => String(s.id) !== String(id));
  save();
  renderSessions();
}
 
// ── TIME HELPERS ──────────────────────────────────────
function fmtTime(t) {
  if (!t) return '';
  let [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}
 
function endTime(t, dur) {
  let [h, m] = t.split(':').map(Number);
  let mins = h * 60 + m + dur;
  return `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}
 
// ── RENDER SESSIONS ───────────────────────────────────
function renderSessions() {
  const day = document.getElementById('viewDaySelect').value;
  document.getElementById('viewDayLabel').textContent = DAY_FULL[day] || day;
 
  const daySessions = sessions.filter(s => s.day === day);
  document.getElementById('countBadge').textContent = daySessions.length;
 
  const list = document.getElementById('sessionsList');
 
  if (daySessions.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No sessions for ${DAY_FULL[day] || day} yet.<br>Add one above!</p>
      </div>`;
  } else {
    list.innerHTML = daySessions.map(s => `
      <div class="session-card" style="background:${s.col.bg}; border-color:${s.col.stripe}22;">
        <div class="session-stripe" style="background:${s.col.stripe}"></div>
        <div class="session-info">
          <div class="session-subject">${s.subj}</div>
          ${s.goal ? `<div class="session-goal">${s.goal}</div>` : ''}
        </div>
        <div class="session-meta">
          <div>
            <div class="meta-time" style="color:${s.col.text}">${fmtTime(s.time)}</div>
            <div class="meta-pill" style="background:${s.col.stripe}18; color:${s.col.text}">${s.dur} min</div>
          </div>
        </div>
        <button class="del-btn" onclick="delSession('${s.id}')" title="Delete">✕</button>
      </div>`).join('');
  }
 
  renderStats();
}
 
// ── RENDER STATS ──────────────────────────────────────
function renderStats() {
  const totalMins  = sessions.reduce((a, s) => a + s.dur, 0);
  const activeDays = new Set(sessions.map(s => s.day)).size;
  const subjects   = new Set(sessions.map(s => s.subj)).size;
  const hrs  = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
 
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card" style="background:#F3F0FF;">
      <div class="val" style="color:#7C6FF7">${hrs}h${mins > 0 ? ` ${mins}m` : ''}</div>
      <div class="lbl" style="color:#A89CF9">Total time</div>
    </div>
    <div class="stat-card" style="background:#FFF0F7;">
      <div class="val" style="color:#FF7EB3">${subjects}</div>
      <div class="lbl" style="color:#FFB3D3">Subjects</div>
    </div>
    <div class="stat-card" style="background:#EAFAF5;">
      <div class="val" style="color:#4DD9AC">${activeDays}</div>
      <div class="lbl" style="color:#7DE8C9">Active Days</div>
    </div>`;
}
 
// ── DOWNLOAD ──────────────────────────────────────────
function downloadTimetable() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let txt = '=== WEEKLY STUDY TIMETABLE ===\n\n';
 
  days.forEach(d => {
    const s = sessions.filter(x => x.day === d);
    if (s.length === 0) return;
    txt += `── ${DAY_FULL[d].toUpperCase()} ──\n`;
    s.forEach(x => {
      txt += `  ${fmtTime(x.time)} – ${fmtTime(endTime(x.time, x.dur))}  |  ${x.subj}  (${x.dur} min)`;
      if (x.goal) txt += `\n    Goal: ${x.goal}`;
      txt += '\n';
    });
    txt += '\n';
  });
 
  const totalMins = sessions.reduce((a, s) => a + s.dur, 0);
  txt += `TOTAL STUDY TIME: ${Math.floor(totalMins / 60)}h ${totalMins % 60}m\n`;
 
  const blob = new Blob([txt], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'study_timetable.txt';
  a.click();
  showToast('Timetable downloaded!');
}
 
// ── TOAST ─────────────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}
 
// ── INIT ──────────────────────────────────────────────
buildColorPicker();
 
// Highlight today's tab automatically
const dayNames   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayShort = dayNames[new Date().getDay()];
const todayTab   = [...document.querySelectorAll('.day-tab')].find(t => t.dataset.day === todayShort);
 
if (todayTab) {
  document.querySelectorAll('.day-tab').forEach(d => d.classList.remove('active'));
  todayTab.classList.add('active');
  activeDay = todayShort;
  document.getElementById('viewDaySelect').value = todayShort;
}
 
renderSessions();
