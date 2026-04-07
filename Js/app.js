/* ─────────────────────────────────────────
   TapQuiz Enterprise — app.js
───────────────────────────────────────── */

'use strict';

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
const state = {
  currentScreen: 'home',
  questionCount: 3,
  currentQuestion: 1,
  totalQuestions: 10,
  timerInterval: null,
  timerWidth: 70,
};

/* ─────────────────────────────────────────
   SAMPLE DATA
───────────────────────────────────────── */
const sampleQuestions = [
  'What year was the company founded?',
  'Which city houses our largest office?',
  'How many countries do we currently operate in?',
  'Who is our Chief People Officer?',
  'What is our 2026 annual revenue target?',
  'Which value is central to our company culture?',
  'How many employees joined in the last fiscal year?',
  'What is the name of our flagship product?',
  'In which year did we complete our last major acquisition?',
  'What percentage of revenue do we invest in R&D?',
];

const sampleAnswers = [
  ['2008', '2011', '2015', '2019'],
  ['New York', 'London', 'Dubai', 'Singapore'],
  ['12', '18', '24', '32'],
  ['Clara Singh', 'Mark Osei', 'Diana Park', 'Tom Reeves'],
  ['$1.2 B', '$800 M', '$2.4 B', '$500 M'],
];

/* ─────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────── */
function go(screenName) {
  // Hide all screens
  document.querySelectorAll('.scr').forEach(el => el.classList.remove('on'));
  // Deactivate all nav buttons
  document.querySelectorAll('.nb').forEach(el => el.classList.remove('on'));

  // Show target screen
  const target = document.getElementById('s-' + screenName);
  if (target) target.classList.add('on');

  // Activate matching nav button
  const navMap = { home: 0, builder: 1, host: 2 };
  if (navMap[screenName] !== undefined) {
    const navBtns = document.querySelectorAll('.nb');
    if (navBtns[navMap[screenName]]) {
      navBtns[navMap[screenName]].classList.add('on');
    }
  }

  state.currentScreen = screenName;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ─────────────────────────────────────────
   TOAST NOTIFICATION
───────────────────────────────────────── */
let toastTimeout = null;

function toast(message) {
  const toaster = document.getElementById('toaster');
  if (!toaster) return;

  toaster.textContent = message;
  toaster.classList.add('on');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toaster.classList.remove('on');
  }, 2600);
}

/* ─────────────────────────────────────────
   BUILDER — Question list
───────────────────────────────────────── */
function selQ(el) {
  document.querySelectorAll('.qi').forEach(q => q.classList.remove('on'));
  el.classList.add('on');

  // Update the editor with a sample question
  const qIndex = Array.from(document.querySelectorAll('.qi')).indexOf(el);
  const textEl = document.getElementById('edit-q-text');
  if (textEl && sampleQuestions[qIndex]) {
    textEl.value = sampleQuestions[qIndex];
  }

  // Update answer options
  if (sampleAnswers[qIndex]) {
    const inputs = document.querySelectorAll('.oi input');
    sampleAnswers[qIndex].forEach((ans, i) => {
      if (inputs[i]) inputs[i].value = ans;
    });
    // Reset correct marker to A
    document.querySelectorAll('.oi').forEach(o => o.classList.remove('ok'));
    const firstOpt = document.querySelector('.oi');
    if (firstOpt) firstOpt.classList.add('ok');
  }
}

function addQ() {
  state.questionCount++;
  const list = document.getElementById('ql');
  if (!list) return;

  const div = document.createElement('div');
  div.className = 'qi';
  div.onclick = function () { selQ(this); };
  div.innerHTML = `
    <div class="qn">Q${state.questionCount}</div>
    <div>
      <div class="qt">New question...</div>
      <div class="qm">4 options · 20 s · 200 pts</div>
    </div>
  `;
  list.appendChild(div);

  // Update summary
  const qcountEl = document.getElementById('qcount');
  if (qcountEl) qcountEl.textContent = state.questionCount;

  const ptsEl = document.getElementById('total-pts');
  if (ptsEl) ptsEl.textContent = (state.questionCount * 200).toLocaleString();

  toast('Question ' + state.questionCount + ' added');
  div.click(); // Select the new question
}

/* ─────────────────────────────────────────
   BUILDER — Answer options
───────────────────────────────────────── */
function markOk(el) {
  const grid = el.closest('.og');
  if (!grid) return;
  grid.querySelectorAll('.oi').forEach(o => o.classList.remove('ok'));
  el.classList.add('ok');
}

/* ─────────────────────────────────────────
   HOST — Next question
───────────────────────────────────────── */
function nextQ() {
  state.currentQuestion++;

  if (state.currentQuestion > state.totalQuestions) {
    toast('Quiz complete — showing final results');
    state.currentQuestion = 1;
    return;
  }

  const qIndex = (state.currentQuestion - 1) % sampleQuestions.length;

  // Update question display
  const dispEl = document.getElementById('q-disp');
  if (dispEl) dispEl.textContent = sampleQuestions[qIndex];

  // Update indicators
  const indEl = document.getElementById('gb-qi');
  if (indEl) indEl.textContent = 'Question ' + state.currentQuestion + ' of ' + state.totalQuestions;

  const subEl = document.getElementById('h-sub');
  if (subEl) subEl.textContent = 'Question ' + state.currentQuestion + ' of ' + state.totalQuestions + ' · 24 participants connected';

  // Update answer tiles
  const tiles = document.querySelectorAll('.at');
  const answers = sampleAnswers[qIndex] || ['Option A', 'Option B', 'Option C', 'Option D'];
  const letters = ['A', 'B', 'C', 'D'];
  tiles.forEach((tile, i) => {
    if (answers[i]) {
      tile.querySelector('.ak').textContent = letters[i];
      tile.childNodes[2] ? (tile.childNodes[2].textContent = answers[i]) : tile.append(answers[i]);
      // Re-set the text node properly
      const ak = tile.querySelector('.ak');
      tile.textContent = '';
      tile.appendChild(ak);
      tile.append(answers[i]);
    }
  });

  // Animate timer bar to random remaining amount
  const randomWidth = Math.floor(Math.random() * 50) + 30;
  const fillEl = document.getElementById('tfill');
  if (fillEl) fillEl.style.width = randomWidth + '%';

  // Randomise response breakdown bars
  randomiseResponseBars();

  toast('Question ' + state.currentQuestion + ' of ' + state.totalQuestions);
}

function randomiseResponseBars() {
  const total = 24;
  let remaining = total;
  const fills = document.querySelectorAll('.rb-fill');
  const counts = document.querySelectorAll('.rb-count');
  const values = [];

  fills.forEach((fill, i) => {
    const val = i === fills.length - 1 ? remaining : Math.floor(Math.random() * (remaining * 0.6));
    values.push(val);
    remaining -= val;
    if (remaining < 0) remaining = 0;
  });

  // Normalise so they sum roughly to total answered
  const answered = values.reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...values);

  fills.forEach((fill, i) => {
    const pct = maxVal > 0 ? Math.round((values[i] / maxVal) * 90) : 10;
    fill.style.height = pct + '%';
  });

  counts.forEach((el, i) => {
    el.textContent = values[i];
  });
}

/* ─────────────────────────────────────────
   JOIN — Submit
───────────────────────────────────────── */
function doJoin() {
  const codeEl = document.getElementById('join-code');
  const nameEl = document.getElementById('join-name');
  const code = codeEl ? codeEl.value.trim() : '';
  const name = nameEl ? nameEl.value.trim() : '';

  if (!code) {
    toast('Please enter a game code');
    if (codeEl) codeEl.focus();
    return;
  }

  if (!name) {
    toast('Please enter your name');
    if (nameEl) nameEl.focus();
    return;
  }

  toast('Joining session ' + code + '…');

  // Simulate joining — in production, connect to WebSocket here
  setTimeout(() => {
    toast('Connected! Waiting for host to start…');
  }, 1500);
}

/* ─────────────────────────────────────────
   TOGGLES (in-page)
───────────────────────────────────────── */
function initToggles() {
  document.querySelectorAll('.tog').forEach(btn => {
    btn.addEventListener('click', function () {
      this.classList.toggle('on');
    });
  });
}

/* ─────────────────────────────────────────
   JOIN CODE — auto-uppercase
───────────────────────────────────────── */
function initJoinInput() {
  const codeInput = document.getElementById('join-code');
  if (codeInput) {
    codeInput.addEventListener('input', function () {
      this.value = this.value.toUpperCase();
    });
  }
}

/* ─────────────────────────────────────────
   DATE — Set today's date in dashboard
───────────────────────────────────────── */
function setTodayDate() {
  const el = document.getElementById('today-date');
  if (!el) return;
  const now = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = now.toLocaleDateString('en-GB', opts);
  el.textContent = formatted + ' · Acme Corp workspace';
}

/* ─────────────────────────────────────────
   TIMER — Animated countdown on host screen
───────────────────────────────────────── */
function startHostTimer() {
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerWidth = 70;

  state.timerInterval = setInterval(() => {
    state.timerWidth -= 0.5;
    if (state.timerWidth <= 0) {
      state.timerWidth = 0;
      clearInterval(state.timerInterval);
    }
    const fillEl = document.getElementById('tfill');
    if (fillEl) fillEl.style.width = state.timerWidth + '%';
  }, 200);
}

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  setTodayDate();
  initToggles();
  initJoinInput();

  // Start timer animation when host screen is viewed
  const hostObserver = new MutationObserver(() => {
    const hostScreen = document.getElementById('s-host');
    if (hostScreen && hostScreen.classList.contains('on')) {
      startHostTimer();
    }
  });

  const hostScreen = document.getElementById('s-host');
  if (hostScreen) {
    hostObserver.observe(hostScreen, { attributes: true, attributeFilter: ['class'] });
  }

  console.log('%cTapQuiz Enterprise loaded', 'color:#FFD60A;background:#0A0F1E;padding:4px 10px;border-radius:4px;font-weight:700;font-size:14px;');
});
