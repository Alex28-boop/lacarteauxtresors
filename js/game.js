let treasures = [];
let currentTreasure = null;
let secondsElapsed = 0;
let timerId = null;
let gameOver = false;
let currentClue = 0;
let playerPosition = null;

async function loadTreasures() {
  const response = await fetch('data/treasures.json');
  if (!response.ok) throw new Error('Impossible de charger les trésors.');
  treasures = await response.json();
}

function chooseTreasure() {
  const index = Math.floor(Math.random() * treasures.length);
  currentTreasure = treasures[index];
}

function startGame() {
  clearInterval(timerId);
  secondsElapsed = 0;
  currentClue = 0;
  gameOver = false;
  playerPosition = null;

  document.getElementById('result').classList.add('hidden');
  document.getElementById('try-button').disabled = true;
  document.getElementById('status-title').textContent = 'À toi de jouer';
  document.getElementById('status-text').textContent =
    'Clique sur la carte pour placer ton curseur.';

  chooseTreasure();
  updateClue();
  updateTimer();

  timerId = setInterval(() => {
    secondsElapsed++;
    updateTimer();

    if (secondsElapsed === 60) {
      currentClue = Math.max(currentClue, 1);
      updateClue();
    }

    if (secondsElapsed === 120) {
      currentClue = Math.max(currentClue, 2);
      updateClue();
    }

    if (secondsElapsed >= 180) {
      endGame(false);
    }
  }, 1000);
}

function updateClue() {
  if (!currentTreasure) return;
  const clue = currentTreasure.clues[currentClue];
  document.getElementById('clue-number').textContent = currentClue + 1;
  document.getElementById('clue-text').textContent = clue;
}

function updateTimer() {
  const remaining = Math.max(0, 180 - secondsElapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timer = document.getElementById('timer');

  timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  timer.classList.toggle('warning', remaining <= 60 && remaining > 20);
  timer.classList.toggle('danger', remaining <= 20);
}

function setPlayerPosition(position) {
  playerPosition = position;
  document.getElementById('try-button').disabled = false;
  document.getElementById('status-text').textContent =
    'Position sélectionnée. Tu peux tenter ta réponse.';
}

function attempt() {
  if (gameOver || !playerPosition) return;

  const distance = distanceInKm(
    playerPosition.lat,
    playerPosition.lng,
    currentTreasure.latitude,
    currentTreasure.longitude
  );

  const remaining = Math.max(0, 180 - secondsElapsed);
  const score = calculateScore(distance, remaining);

  endGame(true, distance, score);
}

function endGame(playerAttempted, distance = null, score = 0) {
  if (gameOver) return;
  gameOver = true;
  clearInterval(timerId);

  document.getElementById('try-button').disabled = true;

  if (!playerAttempted) {
    showResult(0, null);
    return;
  }

  showTarget(currentTreasure.latitude, currentTreasure.longitude);
  if (playerPosition) fitToPoints(playerPosition, {
    lat: currentTreasure.latitude,
    lng: currentTreasure.longitude
  });

  showResult(score, distance);
}

function showResult(score, distance) {
  const result = document.getElementById('result');
  result.classList.remove('hidden');

  result.innerHTML = `
    <h2>🏆 Résultat</h2>
    <div class="score">${score.toLocaleString('fr-FR')} pts</div>
    <p><strong>${currentTreasure.treasure}</strong></p>
    ${distance !== null
      ? `<p>Distance : <strong>${formatDistance(distance)}</strong></p>`
      : `<p>Temps écoulé !</p>`
    }
    <p>Ville : ${currentTreasure.city}</p>
  `;

  document.getElementById('status-title').textContent = 'Partie terminée';
  document.getElementById('status-text').textContent =
    'Le trésor est maintenant affiché sur la carte.';
}
