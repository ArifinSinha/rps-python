const nameGate = document.getElementById('nameGate');
const gameArea = document.getElementById('gameArea');
const nameInput = document.getElementById('nameInput');
const nameSubmit = document.getElementById('nameSubmit');
const youLabel = document.getElementById('youLabel');
const youScore = document.getElementById('youScore');
const cpuScore = document.getElementById('cpuScore');
const youHand = document.getElementById('youHand');
const cpuHand = document.getElementById('cpuHand');
const banner = document.getElementById('resultBanner');
const gameCount = document.getElementById('gameCount');
const buttons = document.querySelectorAll('.choice-btn');
const bestofButtons = document.querySelectorAll('.bestof-btn');
const matchOverBanner = document.getElementById('matchOverBanner');
const matchOverText = document.getElementById('matchOverText');
const newMatchBtn = document.getElementById('newMatchBtn');
const historyEl = document.getElementById('history');

let bestOf = 3;

bestofButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    bestofButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    bestOf = parseInt(btn.dataset.bestof);
  });
});

newMatchBtn.addEventListener('click', async () => {
  await fetch('/set_name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: youLabel.textContent })
  });
  matchOverBanner.style.display = 'none';
  youScore.textContent = '0';
  cpuScore.textContent = '0';
  gameCount.textContent = '';
  banner.textContent = `${youLabel.textContent}, pick your weapon`;
  youHand.className = 'hand';
  cpuHand.className = 'hand';
  youHand.innerHTML = '?';
  cpuHand.innerHTML = '?';
  historyEl.innerHTML = '';
  busy = false;
  buttons.forEach(b => b.disabled = false);
});

// SVG icons instead of emoji - each uses currentColor so CSS controls the color
const ICONS = {
  1: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c-6 0-11 3-14 8-4 1-7 4-8 8-2 6 1 12 6 15 2 6 8 10 16 10s14-4 16-10c5-3 8-9 6-15-1-4-4-7-8-8-3-5-8-8-14-8z" fill="currentColor"/>
        <path d="M20 30c2-2 5-3 8-3M36 30c2-2 5-3 8-3" stroke="rgba(0,0,0,0.25)" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
  2: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 6h24l8 8v44H16z" fill="currentColor"/>
        <path d="M40 6v8h8z" fill="rgba(0,0,0,0.2)"/>
        <line x1="22" y1="24" x2="42" y2="24" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
        <line x1="22" y1="32" x2="42" y2="32" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
        <line x1="22" y1="40" x2="36" y2="40" stroke="rgba(0,0,0,0.2)" stroke-width="2"/>
      </svg>`,
  3: `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="48" r="7" stroke="currentColor" stroke-width="4"/>
        <circle cx="16" cy="16" r="7" stroke="currentColor" stroke-width="4"/>
        <path d="M20 20L54 50M20 44L54 14" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>`
};

let busy = false;

// --- Simple sound effects, generated with the Web Audio API (no files needed) ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, delay = 0, type = 'sine', volume = 0.15) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const startTime = ctx.currentTime + delay;
  osc.start(startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.stop(startTime + duration);
}

function playClickSound() {
  playTone(400, 0.05, 0, 'square', 0.08);
}
function playWinSound() {
  playTone(523, 0.12, 0);      // C5
  playTone(659, 0.12, 0.12);   // E5
  playTone(784, 0.2, 0.24);    // G5
}
function playLoseSound() {
  playTone(300, 0.25, 0, 'sawtooth', 0.1);
  playTone(200, 0.3, 0.15, 'sawtooth', 0.1);
}
function playDrawSound() {
  playTone(350, 0.2, 0, 'triangle', 0.1);
}

nameSubmit.addEventListener('click', startGame);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

// fill the three button icons on page load
document.querySelectorAll('.choice-btn').forEach(btn => {
  btn.querySelector('.icon').innerHTML = ICONS[btn.dataset.choice];
});

function addHistoryChip(outcome) {
  const chip = document.createElement('div');
  chip.className = `chip ${outcome}`;
  chip.textContent = outcome === 'win' ? 'W' : outcome === 'lose' ? 'L' : 'D';
  historyEl.appendChild(chip);
  while (historyEl.children.length > 15) {
    historyEl.removeChild(historyEl.firstChild);
  }
}

async function startGame() {
  const name = nameInput.value.trim() || 'PlayerOne';
  const res = await fetch('/set_name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const data = await res.json();

  youLabel.textContent = data.name;
  banner.textContent = `${data.name}, pick your weapon`;
  nameGate.style.display = 'none';
  gameArea.style.display = 'block';
}

buttons.forEach(btn => {
  btn.addEventListener('click', () => playRound(btn.dataset.choice));
});

async function playRound(choice) {
  if (busy) return;
  busy = true;
  playClickSound();
  buttons.forEach(b => b.disabled = true);

  youHand.className = 'hand';
  cpuHand.className = 'hand';
  youHand.innerHTML = '?';
  cpuHand.innerHTML = '?';

  // countdown sequence before revealing anything
  const beats = ['Rock...', 'Paper...', 'Scissors...', 'Shoot!'];
  for (const word of beats) {
    banner.textContent = word;
    banner.classList.add('pulse');
    await new Promise(resolve => setTimeout(resolve, 700));
    banner.classList.remove('pulse');
  }

  youHand.innerHTML = ICONS[choice];

  const res = await fetch('/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice })
  });
  const data = await res.json();

  cpuHand.innerHTML = ICONS[data.computer];
  banner.textContent = data.message;

  if (data.message.includes('you win')) {
    youHand.classList.add('win');
    cpuHand.classList.add('lose');
    playWinSound();
    addHistoryChip('win');
  } else if (data.message.includes('Python wins')) {
    cpuHand.classList.add('win');
    youHand.classList.add('lose');
    playLoseSound();
    addHistoryChip('lose');
  } else {
    youHand.classList.add('draw');
    cpuHand.classList.add('draw');
    playDrawSound();
    addHistoryChip('draw');
  }

  youScore.textContent = data.player_wins;
  cpuScore.textContent = data.python_wins;
  gameCount.textContent = `Game ${data.game_count}`;

  const target = Math.ceil(bestOf / 2);
  if (data.player_wins >= target || data.python_wins >= target) {
    const winnerText = data.player_wins >= target
      ? `🏆 ${youLabel.textContent} wins the match!`
      : `🏆 Python wins the match!`;
    matchOverText.textContent = winnerText;
    matchOverBanner.style.display = 'block';
    buttons.forEach(b => b.disabled = true);
  } else {
    busy = false;
    buttons.forEach(b => b.disabled = false);
  }
}