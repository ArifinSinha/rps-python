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

const ICONS = { 1: '✊', 2: '✋', 3: '✌️' };
let busy = false;

nameSubmit.addEventListener('click', startGame);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

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
  buttons.forEach(b => b.disabled = true);

  youHand.className = 'hand';
  cpuHand.className = 'hand';
  youHand.textContent = ICONS[choice];
  cpuHand.textContent = '?';
  banner.textContent = 'Python is choosing...';

  const res = await fetch('/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ choice })
  });
  const data = await res.json();

  setTimeout(() => {
    cpuHand.textContent = ICONS[data.computer];
    banner.textContent = data.message;

    if (data.message.includes('you win')) {
      youHand.classList.add('win');
      cpuHand.classList.add('lose');
    } else if (data.message.includes('Python wins')) {
      cpuHand.classList.add('win');
      youHand.classList.add('lose');
    } else {
      youHand.classList.add('draw');
      cpuHand.classList.add('draw');
    }

    youScore.textContent = data.player_wins;
    cpuScore.textContent = data.python_wins;
    gameCount.textContent = `Game ${data.game_count}`;

    busy = false;
    buttons.forEach(b => b.disabled = false);
  }, 500);
}