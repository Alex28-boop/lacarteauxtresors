let map;
let playerMarker = null;
let targetMarker = null;

function initMap() {
  map = L.map('map').setView([46.58, 0.34], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', (event) => {
    setPlayerPosition(event.latlng.lat, event.latlng.lng);
  });
}

function setPlayerPosition(lat, lng) {
  if (playerMarker) {
    playerMarker.setLatLng([lat, lng]);
  } else {
    playerMarker = L.marker([lat, lng]).addTo(map);
    playerMarker.bindPopup('Ta position').openPopup();
  }

  window.dispatchEvent(new CustomEvent('player-position-changed', {
    detail: { lat, lng }
  }));
}

function showTarget(lat, lng) {
  if (targetMarker) targetMarker.remove();

  targetMarker = L.circleMarker([lat, lng], {
    radius: 9,
    weight: 3
  }).addTo(map);

  targetMarker.bindPopup('🎯 Trésor').openPopup();
}

function getPlayerPosition() {
  if (!playerMarker) return null;
  const p = playerMarker.getLatLng();
  return { lat: p.lat, lng: p.lng };
}

function fitToPoints(player, target) {
  const bounds = L.latLngBounds([
    [player.lat, player.lng],
    [target.lat, target.lng]
  ]);
  map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
}
