// Socket.IO client connection and event handlers
let socket;

function initSocket() {
  // Connect to server (same origin in production)
  socket = io();

  // === LOBBY EVENTS ===
  socket.on('roomCreated', ({ roomCode, slot }) => {
    clientState.roomCode = roomCode;
    clientState.playerSlot = slot;
    showWaitingRoom(roomCode);
  });

  socket.on('joinedRoom', ({ roomCode, slot, teams }) => {
    clientState.roomCode = roomCode;
    clientState.playerSlot = slot;
  });

  socket.on('joinError', ({ reason }) => {
    alert('Could not join: ' + reason);
  });

  socket.on('playerJoined', ({ teams, playerCount }) => {
    // Both players connected
  });

  // === DRAFT EVENTS ===
  socket.on('startDraft', ({ teams }) => {
    showDraftScreen(teams);
  });

  socket.on('draftUpdated', (draftState) => {
    updateDraftUI(draftState);
  });

  socket.on('draftPickError', ({ reason }) => {
    console.warn('Draft pick error:', reason);
  });

  socket.on('draftComplete', (draftState) => {
    updateDraftUI(draftState);
    // Auto-transition to lineup screen
    setTimeout(() => {
      // Initialize lineups from batters
      clientState.draftState.teams.forEach(t => {
        if (!t.lineup || t.lineup.length === 0) t.lineup = [...t.batters];
        if (t.activePitcher === undefined) t.activePitcher = 0;
      });
      showScreen('lineup');
      renderLineups();
    }, 1000);
  });

  // === LINEUP EVENTS ===
  socket.on('lineupUpdated', ({ slot, lineup }) => {
    if (clientState.draftState) {
      clientState.draftState.teams[slot].lineup = lineup;
    }
    renderLineups();
  });

  socket.on('pitcherUpdated', ({ slot, pitcherIdx }) => {
    if (clientState.draftState) {
      clientState.draftState.teams[slot].activePitcher = pitcherIdx;
    }
  });

  socket.on('playerReady', ({ slot }) => {
    // Show ready indicator
  });

  socket.on('gameStart', ({ gameState }) => {
    showGameScreen(gameState);
  });

  // === GAME EVENTS ===
  socket.on('spinResult', (data) => {
    clientState.gameState = data.gameState;

    // Animate the wheel
    const b = data.batter;
    if (b && b.deg) {
      let mid = 0;
      for (let i = 0; i < data.outcomeIdx; i++) mid += b.deg[i];
      mid += b.deg[data.outcomeIdx] / 2;
      const targetMod = (360 - mid) % 360;
      const currentMod = clientState.wheelRot % 360;
      let delta = ((targetMod - currentMod) + 360) % 360;
      if (delta < 30) delta += 360;
      const extraSpins = 4 + Math.floor(Math.random() * 3);
      clientState.wheelRot += delta + extraSpins * 360;

      const wh = document.getElementById('gameWheel');
      if (wh) wh.style.transform = `rotate(${clientState.wheelRot}deg)`;
    }

    setTimeout(() => {
      document.getElementById('spinResult').innerHTML =
        `<span style="color:${OUTCOME_COLORS[data.outcomeIdx]}">${OUTCOME_LABELS[data.outcomeIdx]}!</span>`;
      fireResultAnim(data.outcome, data.outcomeIdx);

      setTimeout(() => {
        const bt = clientState.gameState.half;
        const isBatter = clientState.playerSlot === bt;
        if (isBatter) {
          document.getElementById('offenseActions').innerHTML =
            `<button class="btn-red" onclick="emitToDefense()">Defense Turn →</button>`;
        } else {
          document.getElementById('offenseActions').innerHTML =
            `<div style="color:var(--dim)">Waiting for opponent...</div>`;
        }
      }, 600);
    }, 3200);
  });

  socket.on('diceResult', (data) => {
    clientState.gameState = data.gameState;
    const d0 = document.getElementById('die0');
    const d1 = document.getElementById('die1');
    document.getElementById('diceOpDisplay').textContent = data.op === 'mul' ? '×' : '+';
    document.getElementById('diceBtns').innerHTML = '';

    // Animate dice rolling
    if (d0) d0.classList.add('rolling');
    if (d1) d1.classList.add('rolling');
    let count = 0;
    const rollInterval = setInterval(() => {
      if (d0) d0.textContent = Math.floor(Math.random() * 10);
      if (d1) d1.textContent = Math.floor(Math.random() * 10);
      count++;
      if (count > 15) {
        clearInterval(rollInterval);
        if (d0) { d0.textContent = data.dice[0]; d0.classList.remove('rolling'); }
        if (d1) { d1.textContent = data.dice[1]; d1.classList.remove('rolling'); }
        document.getElementById('diceResultText').textContent =
          `${data.dice[0]} ${data.op === 'mul' ? '×' : '+'} ${data.dice[1]} = ${data.result}`;
        handleDiceResult(data);
      }
    }, 80);
  });

  function handleDiceResult(data) {
    if (data.matched) {
      const ci = clientState.gameState.lastResultIdx;
      const leftIdx = ci > 0 ? ci - 1 : OUTCOME_KEYS.length - 1;
      const rightIdx = ci < OUTCOME_KEYS.length - 1 ? ci + 1 : 0;
      const ft = 1 - clientState.gameState.half;
      const isFielding = clientState.playerSlot === ft;

      // Highlight matched chip
      const chip = document.getElementById((data.op === 'mul' ? 'mul' : 'add') + data.result);
      if (chip) chip.classList.add('matched');

      if (isFielding) {
        document.getElementById('shiftArea').innerHTML = `
          <div style="text-align:center;color:var(--gold);font-weight:700;margin-bottom:6px">Match! Choose shift direction:</div>
          <div class="shift-area">
            <button class="btn-sm btn-blue" onclick="emitShift(-1)">← ${OUTCOME_KEYS[leftIdx]}</button>
            <button class="btn-sm btn-gold" onclick="emitShift(0)">Keep ${OUTCOME_KEYS[ci]}</button>
            <button class="btn-sm btn-red" onclick="emitShift(1)">→ ${OUTCOME_KEYS[rightIdx]}</button>
          </div>`;
      } else {
        document.getElementById('shiftArea').innerHTML =
          `<div style="text-align:center;color:var(--gold);margin:8px 0">Match! Opponent is choosing shift...</div>`;
      }
    } else {
      document.getElementById('shiftArea').innerHTML =
        `<div style="text-align:center;color:var(--dim);margin:8px 0">No match — no shift available</div>`;
      showApplyUI();
    }
  }

  socket.on('outcomeShifted', ({ gameState }) => {
    clientState.gameState = gameState;
    const idx = gameState.lastResultIdx;
    document.getElementById('shiftArea').innerHTML =
      `<div style="text-align:center;color:var(--gold);font-weight:700;margin:8px 0">Result: ${OUTCOME_LABELS[idx]}</div>`;
    showApplyUI();
  });

  socket.on('gameStateUpdated', ({ gameState }) => {
    clientState.gameState = gameState;
    renderGamePhase();
  });

  socket.on('resultApplied', ({ runsScored, gameState, gameOver }) => {
    clientState.gameState = gameState;
    if (runsScored > 0) {
      fireResultAnim(`+${runsScored} RUN${runsScored > 1 ? 'S' : ''}!`, -1, true);
    }
    setTimeout(() => renderGamePhase(), runsScored > 0 ? 800 : 300);
  });

  socket.on('wildCardPlayed', ({ card, teamIdx, gameState, gameOver }) => {
    clientState.gameState = gameState;
    showWCAnimation(card);
    setTimeout(() => renderGamePhase(), 1000);
  });

  socket.on('gameOver', ({ gameState, winner }) => {
    clientState.gameState = gameState;
    clientState.gameState.gameOver = true;
    renderGamePhase();
  });

  // === DISCONNECT/RECONNECT ===
  socket.on('playerDisconnected', ({ message }) => {
    alert(message);
  });

  socket.on('opponentReconnected', () => {
    // Opponent back
  });

  socket.on('reconnected', ({ roomCode, slot, phase, gameState }) => {
    clientState.roomCode = roomCode;
    clientState.playerSlot = slot;
    clientState.gameState = gameState;
    if (phase === 'game') {
      showGameScreen(gameState);
    } else if (phase === 'draft') {
      showScreen('draft');
    } else if (phase === 'lineup') {
      showScreen('lineup');
      renderLineups();
    }
  });

  socket.on('forfeit', ({ disconnectedSlot, winner }) => {
    alert(`Opponent forfeited. ${clientState.playerSlot === winner ? 'You win!' : 'You lose.'}`);
  });
}

function showApplyUI() {
  const ft = 1 - clientState.gameState.half;
  const isFielding = clientState.playerSlot === ft;
  if (isFielding) {
    document.getElementById('defenseActions').innerHTML =
      `<button class="btn-gold" onclick="emitApplyResult()">Apply Result</button>`;
  } else {
    document.getElementById('defenseActions').innerHTML =
      `<div style="color:var(--dim)">Waiting for opponent to apply...</div>`;
  }
}
