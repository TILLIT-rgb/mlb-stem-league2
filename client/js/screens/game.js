function showGameScreen(gs) {
  clientState.gameState = gs;
  showScreen('game');
  renderGamePhase();
}

function renderGamePhase() {
  const gs = clientState.gameState;
  if (!gs) return;
  renderScoreboard(gs);

  if (gs.gameOver) {
    renderGameOver(gs);
    return;
  }

  const topBot = gs.half === 0 ? 'Top' : 'Bottom';
  document.getElementById('gameStatus').innerHTML = `<b>${topBot} of ${gs.inning}</b> — ${gs.teams[gs.half].name} batting`;

  if (gs.phase === 'offense') {
    renderOffensePhase(gs);
  } else {
    renderDefensePhase(gs);
  }
}

function renderOffensePhase(gs) {
  const bt = gs.half;
  const bi = gs.teams[bt].lineup[gs.batterIdx[bt] % gs.teams[bt].lineup.length];
  const b = BATTERS[bi];
  const isBattingTeam = clientState.playerSlot === bt;

  let wcHtml = renderWCHand(gs, bt, 'pre', WILD_CARD_DEFS, BATTERS, PITCHERS);

  document.getElementById('gamePhase').innerHTML = `
    <div class="phase-panel">
      <span class="phase-label off">Offense</span>
      <div class="batter-info">${avatarHTML(b.n)}<div class="player-detail">
        <h3>${b.n}</h3>
        <div class="pd-pos">${b.p.join(' / ')}</div>
        <div class="pd-stats">BA ${b.ba.toFixed(3)} | OBP ${b.obp.toFixed(3)} | SLG ${b.slg.toFixed(3)}</div>
      </div></div>
      ${renderBasesAndOuts(gs)}
      <div class="wheel-area">
        <div class="wheel-container">
          <div class="wheel-pointer"></div>
          <canvas id="gameWheel" width="560" height="560" style="width:280px;height:280px;transition:transform 3s cubic-bezier(.17,.67,.12,.99)"></canvas>
        </div>
        <div class="spin-result" id="spinResult"></div>
        ${isBattingTeam && !gs.spinDone ? '<button class="btn-gold" id="spinBtn" onclick="emitSpin()">🎰 Spin!</button>' : ''}
        ${!isBattingTeam && !gs.spinDone ? '<div style="color:var(--dim);text-align:center">Waiting for opponent to spin...</div>' : ''}
      </div>
      ${wcHtml}
      <div class="action-btns" id="offenseActions"></div>
    </div>`;
  drawGameWheel('gameWheel', b.deg);

  const wh = document.getElementById('gameWheel');
  if (wh) {
    wh.style.transition = 'none';
    wh.style.transform = `rotate(${clientState.wheelRot}deg)`;
    void wh.offsetHeight;
    wh.style.transition = 'transform 3s cubic-bezier(.17,.67,.12,.99)';
  }
}

function renderDefensePhase(gs) {
  const ft = 1 - gs.half;
  const pi = gs.teams[ft].pitchers[gs.teams[ft].activePitcher];
  const p = PITCHERS[pi];
  const isFieldingTeam = clientState.playerSlot === ft;

  let wcHtml = renderWCHand(gs, ft, 'post', WILD_CARD_DEFS, BATTERS, PITCHERS);

  document.getElementById('gamePhase').innerHTML = `
    <div class="phase-panel">
      <span class="phase-label def">Defense</span>
      <div class="pitcher-info">${avatarHTML(p.n)}<div class="player-detail">
        <h3>${p.n}</h3><div class="pd-pos">Pitcher</div>
      </div></div>
      <div class="reminder-bar">Spin result: <b style="color:${OUTCOME_COLORS[gs.lastResultIdx]}">${OUTCOME_LABELS[gs.lastResultIdx]}</b></div>
      <div class="pitch-numbers">
        <div class="pitch-num-group"><span class="png-label">Multiply (×)</span>
          <div class="png-chips">${p.mul.map(v => `<span class="pchip mul" id="mul${v}">${v}</span>`).join('')}</div></div>
        <div class="pitch-num-group"><span class="png-label">Add (+)</span>
          <div class="png-chips">${p.add.map(v => `<span class="pchip add" id="add${v}">${v}</span>`).join('')}</div></div>
      </div>
      <div class="dice-area">
        <div class="dice-row">
          <div class="die" id="die0">${gs.diceVals[0] !== null ? gs.diceVals[0] : '?'}</div>
          <div class="dice-op" id="diceOpDisplay">${gs.diceOp === 'mul' ? '×' : gs.diceOp === 'add' ? '+' : ''}</div>
          <div class="die" id="die1">${gs.diceVals[1] !== null ? gs.diceVals[1] : '?'}</div>
          <div class="dice-result-text" id="diceResultText">${gs.diceDone ? `${gs.diceVals[0]} ${gs.diceOp === 'mul' ? '×' : '+'} ${gs.diceVals[1]} = ${gs.diceResult}` : ''}</div>
        </div>
        <div class="dice-btns" id="diceBtns">
          ${isFieldingTeam && !gs.diceDone ? `
            <button class="btn-blue" onclick="emitRollDice('mul')">Roll × Multiply</button>
            <button class="btn-red" onclick="emitRollDice('add')">Roll + Add</button>
          ` : ''}
          ${!isFieldingTeam && !gs.diceDone ? '<div style="color:var(--dim)">Waiting for opponent to roll...</div>' : ''}
        </div>
      </div>
      <div id="shiftArea"></div>
      ${wcHtml}
      <div class="action-btns" id="defenseActions"></div>
    </div>`;
}

function renderGameOver(gs) {
  const winner = gs.score[0] > gs.score[1] ? 0 : 1;
  const isWinner = clientState.playerSlot === winner;
  confetti();
  document.getElementById('gameStatus').innerHTML = '';
  document.getElementById('gamePhase').innerHTML = `
    <div class="game-over-panel">
      <h1>Game Over!</h1>
      <div class="final-score">
        <span style="color:var(--blue)">${gs.teams[0].name} ${gs.score[0]}</span>
        <span style="color:var(--dim)"> — </span>
        <span style="color:var(--red)">${gs.score[1]} ${gs.teams[1].name}</span>
      </div>
      <p style="color:var(--gold);font-size:1.3em;margin:12px 0">${gs.teams[winner].name} wins!${isWinner ? ' 🎉' : ''}</p>
      <button class="btn-gold" onclick="location.reload()" style="margin-top:16px">New Game</button>
    </div>`;
}

// Emit functions
function emitSpin() {
  socket.emit('spinWheel', { roomCode: clientState.roomCode });
  const btn = document.getElementById('spinBtn');
  if (btn) btn.disabled = true;
}

function emitRollDice(op) {
  socket.emit('rollDice', { roomCode: clientState.roomCode, operation: op });
  document.getElementById('diceBtns').innerHTML = '';
}

function emitShift(dir) {
  socket.emit('shiftOutcome', { roomCode: clientState.roomCode, direction: dir });
}

function emitApplyResult() {
  socket.emit('applyResult', { roomCode: clientState.roomCode });
}

function emitToDefense() {
  socket.emit('toDefense', { roomCode: clientState.roomCode });
}

function emitPlayWildCard(cardIdx, timing) {
  socket.emit('playWildCard', { roomCode: clientState.roomCode, cardIdx, timing });
}

function fireResultAnim(text, idx, isRun) {
  const ol = document.getElementById('resultOverlay');
  const rt = document.getElementById('resultText');
  const color = idx >= 0 ? OUTCOME_COLORS[idx] : (isRun ? 'var(--gold)' : '#fff');
  const icons = { HR: '💣', SO: '🌀', '3B': '⚡', '2B': '🔥', '1B': '💥', BB: '👀', HBP: '😤', FO: '✈️', GO: '⬇️' };
  const icon = idx >= 0 ? (icons[OUTCOME_KEYS[idx]] || '') : '🎉';
  rt.innerHTML = `<span style="color:${color}">${icon} ${typeof text === 'string' ? text : OUTCOME_LABELS[idx]}</span>`;
  ol.classList.remove('show'); void ol.offsetHeight; ol.classList.add('show');
  setTimeout(() => ol.classList.remove('show'), 900);
  if (text === 'Home Run' || isRun) confetti();
}

function showWCAnimation(wc) {
  const ol = document.getElementById('wcOverlay');
  document.getElementById('wcPlayCard').innerHTML = `
    <div class="wpc-icon">${wc.icon}</div>
    <div class="wpc-name">${wc.name}</div>
    <div class="wpc-desc">${wc.desc}</div>`;
  ol.classList.remove('show'); void ol.offsetHeight; ol.classList.add('show');
  setTimeout(() => ol.classList.remove('show'), 1000);
}
