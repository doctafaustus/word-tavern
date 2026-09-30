'use strict';

let lastRevision;

async function checkForChanges() {
  const response = await fetch('/__dev/revision', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Development reload check failed: HTTP ${response.status}`);
  }

  const revision = await response.text();
  if (lastRevision && revision !== lastRevision) {
    window.location.reload();
    return;
  }
  lastRevision = revision;
}

function pollForChanges() {
  checkForChanges().catch((error) => console.error(error));
}

pollForChanges();
window.setInterval(pollForChanges, 1000);
