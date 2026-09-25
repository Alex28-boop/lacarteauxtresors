const ROUND_DURATION = 180; // secondes par manche
const CLUE_INTERVAL = 30;   // secondes entre chaque indice
const MAX_ATTEMPTS = 2;
const TOTAL_ROUNDS = 5;

const treasures = [
  {
    city: "Poitiers",
    place: "Parc de Blossac",
    lat: 46.5791, lng: 0.3376,
    clues: [
      "Cette ville est l'ancienne capitale du Poitou.",
      "Le trésor se trouve dans un grand espace vert au sud du centre historique.",
      "Le trésor est l'un des parcs les plus connus de la ville."
    ]
  },
  {
    city: "Nantes",
    place: "Jardin des Plantes",
    lat: 47.2186, lng: -1.5486,
    clues: [
      "Cette ville est traversée par la Loire, tout près de l'océan Atlantique.",
      "Le trésor se trouve juste à côté de la gare, dans un jardin botanique.",
      "Ce jardin abrite de nombreuses serres et un célèbre éléphant mécanique à proximité."
    ]
  },
  {
    city: "Lyon",
    place: "Parc de la Tête d'Or",
    lat: 45.7773, lng: 4.8546,
    clues: [
      "Cette ville est située au confluent du Rhône et de la Saône.",
      "Le trésor se trouve dans l'un des plus grands parcs urbains de France.",
      "Ce parc doit son nom à une légende de tête de statue en or enfouie."
    ]
  },
  {
    city: "Toulouse",
    place: "Jardin des Plantes",
    lat: 43.5951, lng: 1.4444,
    clues: [
      "On surnomme cette ville la Ville Rose.",
      "Le trésor se trouve dans un jardin proche du Muséum d'Histoire Naturelle.",
      "Ce jardin fait partie d'un ensemble de parcs le long du canal du Midi."
    ]
  },
  {
    city: "Bordeaux",
    place: "Jardin Public",
    lat: 44.8484, lng: -0.5793,
    clues: [
      "Cette ville est réputée pour ses vignobles, au bord de la Garonne.",
      "Le trésor se trouve dans le plus ancien jardin public de la ville.",
      "Ce jardin du 18e siècle borde le quartier des Chartrons."
    ]
  }
];

let map;
let playerMarker = null;
let targetMarker = null;
let playerPosition = null;

let currentRound = 0;
let totalScore = 0;
let attemptsUsed = 0;
let seconds = 0;
let shownClueIndex = 0;
let finished = false;
let timerInterval = null;

function start() {
  map = L.map("map", { zoomControl: true }).setView([46.6, 2.5], 6);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  map.on("click", onMapClick);

  document.getElementById("try").addEventListener("click", tryAnswer);
  document.getElementById("next-round").addEventListener("click", nextRound);

  // Important : force Leaflet à recalculer la taille de la carte.
  setTimeout(() => map.invalidateSize(), 100);

  startRound();
}

function startRound() {
  finished = false;
  attemptsUsed = 0;
  seconds = 0;
  shownClueIndex = 0;
  playerPosition = null;

  if (playerMarker) { playerMarker.remove(); playerMarker = null; }
  if (targetMarker) { targetMarker.remove(); targetMarker = null; }

  document.getElementById("result").classList.add("hidden");
  document.getElementById("next-round").classList.add("hidden");
  document.getElementById("attempt-info").textContent = "";
  document.getElementById("round-number").textContent = currentRound + 1;
  document.getElementById("clue-number").textContent = "1";
  document.getElementById("clue").textContent = treasures[currentRound].clues[0];

  const tryBtn = document.getElementById("try");
  tryBtn.disabled = true;
  tryBtn.textContent = `📍 JE TENTE (1/${MAX_ATTEMPTS})`;

  map.setView([46.6, 2.5], 6);

  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(tick, 1000);
}

function tick() {
  if (finished) return;

  seconds++;
  updateTimer();
  updateClueByTime();

  if (seconds >= ROUND_DURATION) {
    finishRound(0, null, true);
  }
}

function updateClueByTime() {
  const treasure = treasures[currentRound];
  const nextIndex = Math.min(
    Math.floor(seconds / CLUE_INTERVAL),
    treasure.clues.length - 1
  );

  if (nextIndex > shownClueIndex) {
    shownClueIndex = nextIndex;
    document.getElementById("clue-number").textContent = shownClueIndex + 1;
    document.getElementById("clue").textContent = treasure.clues[shownClueIndex];
  }
}

function updateTimer() {
  const remaining = Math.max(0, ROUND_DURATION - seconds);
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  document.getElementById("timer").textContent =
    String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
}

function onMapClick(e) {
  if (finished) return;

  playerPosition = e.latlng;

  if (playerMarker) {
    playerMarker.setLatLng(e.latlng);
  } else {
    playerMarker = L.marker(e.latlng).addTo(map);
  }

  document.getElementById("try").disabled = false;
}

function tryAnswer() {
  if (!playerPosition || finished) return;

  const treasure = treasures[currentRound];
  const distance = map.distance(playerPosition, L.latLng(treasure.lat, treasure.lng));
  const km = distance / 1000;

  attemptsUsed++;

  if (attemptsUsed < MAX_ATTEMPTS) {
    // Première tentative ratée : on donne la distance et on laisse retenter.
    document.getElementById("attempt-info").textContent =
      `Tentative ${attemptsUsed}/${MAX_ATTEMPTS} : tu es à ${formatDistance(km)} du trésor. Retente ta chance !`;

    const tryBtn = document.getElementById("try");
    tryBtn.textContent = `📍 JE TENTE (${attemptsUsed + 1}/${MAX_ATTEMPTS})`;
    tryBtn.disabled = true; // attend un nouveau clic sur la carte
  } else {
    // Dernière tentative : elle est définitive et sert au calcul du score.
    const remaining = Math.max(0, ROUND_DURATION - seconds);
    const score = Math.max(
      0,
      Math.round(10000 * Math.exp(-km / 2.2) + remaining * 5)
    );
    finishRound(score, km, false);
  }
}

function finishRound(score, km, timeout) {
  finished = true;
  totalScore += score;

  const treasure = treasures[currentRound];

  if (targetMarker) targetMarker.remove();
  targetMarker = L.circleMarker([treasure.lat, treasure.lng], {
    radius: 10,
    weight: 4
  }).addTo(map);
  targetMarker.bindPopup("🎯 " + treasure.place).openPopup();

  document.getElementById("try").disabled = true;
  document.getElementById("attempt-info").textContent = "";

  const isLastRound = currentRound === TOTAL_ROUNDS - 1;
  const result = document.getElementById("result");
  const content = document.getElementById("result-content");
  result.classList.remove("hidden");

  let html = "";
  if (timeout) {
    html += `<h2>⏱️ Temps écoulé</h2><p>Le trésor était à <strong>${treasure.place}</strong>, à ${treasure.city}.</p>`;
  } else {
    html += `<h2>🏆 Manche ${currentRound + 1}/${TOTAL_ROUNDS}</h2>` +
      `<div class="score">${score.toLocaleString("fr-FR")} pts</div>` +
      `<p>Distance finale : <strong>${formatDistance(km)}</strong></p>` +
      `<p>📍 ${treasure.place} — ${treasure.city}</p>`;
  }
  html += `<p class="total-score">Score total : ${totalScore.toLocaleString("fr-FR")} pts</p>`;

  content.innerHTML = html;

  const nextBtn = document.getElementById("next-round");
  nextBtn.textContent = isLastRound ? "🏁 Voir le score final" : "▶ Manche suivante";
  nextBtn.classList.remove("hidden");
}

function nextRound() {
  const isLastRound = currentRound === TOTAL_ROUNDS - 1;

  if (isLastRound) {
    showFinalScreen();
    return;
  }

  currentRound++;
  startRound();
}

function showFinalScreen() {
  clearInterval(timerInterval);

  document.getElementById("next-round").classList.add("hidden");
  const content = document.getElementById("result-content");
  content.innerHTML =
    `<h2>🎉 Partie terminée !</h2>` +
    `<div class="score">${totalScore.toLocaleString("fr-FR")} pts</div>` +
    `<p>Sur ${TOTAL_ROUNDS} manches jouées.</p>` +
    `<button id="restart" class="restart-btn">🔄 Rejouer</button>`;

  document.getElementById("restart").addEventListener("click", () => {
    location.reload();
  });
}

function formatDistance(km) {
  return km < 1
    ? Math.round(km * 1000) + " m"
    : km.toFixed(2) + " km";
}

window.addEventListener("load", start);
