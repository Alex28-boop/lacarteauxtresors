document.addEventListener('DOMContentLoaded', async () => {
  initMap();

  window.addEventListener('player-position-changed', (event) => {
    setPlayerPosition(event.detail);
  });

  document.getElementById('try-button').addEventListener('click', attempt);
  document.getElementById('restart-button').addEventListener('click', startGame);

  try {
    await loadTreasures();
    startGame();
  } catch (error) {
    console.error(error);
    document.getElementById('clue-text').textContent =
      'Erreur de chargement des données. Vérifie que le projet est bien lancé depuis un serveur web.';
  }
});
