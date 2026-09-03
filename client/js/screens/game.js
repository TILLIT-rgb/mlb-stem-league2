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
  document.getElementById('gameStatus').innerHTML = fmtGameStatus(gs.inning, gs.half, gs.teams[gs.half].name);
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
      <span class="phase-label off">${t('offense')}</span>
      <div class="batter-info">${avatarHTML(nm(b))}<div class="player-detail">
        <h3>${nm(b)}</h3>
        <div class="pd-pos">${b.p.join(' / ')}</div>
        <div class="pd-stats">${t('ba')} ${b.ba.toFixed(3)} | ${t('obp')} ${b.obp.toFixed(3)} | ${t('slg')} ${b.slg.toFixed(3)}</div>
      </div></div>
      ${renderBasesAndOuts(gs)}
      <div class="wheel-area">
        <div class="wheel-container">
          <div class="wheel-pointer"></div>
          <canvas id="gameWheel" width="560" height="560" style="width:280px;height:280px;transition:transform 3s cubic-bezier(.17,.67,.12,.99)"></canvas>
        </div>
        <div class="spin-result" id="spinResult"></div>
        ${isBattingTeam && !gs.spinDone ? `<button class="btn-gold" id="spinBtn" onclick="emitSpin()">${t('spin_btn')}</button>` : ''}
        ${!isBattingTeam && !gs.spinDone ? `<div style="color:var(--dim);text-align:center">${t('waiting_spin')}</div>` : ''}
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
      <span class="phase-label def">${t('defense')}</span>
      <div class="pitcher-info">${avatarHTML(nm(p))}<div class="player-detail">
        <h3>${nm(p)}</h3><div class="pd-pos">${t('pitcher')}</div>
      </div></div>
      <div class="reminder-bar">${t('spin_result')} <b style="color:${OUTCOME_COLORS[gs.lastResultIdx]}">${outcomeLabel(gs.lastResultIdx)}</b></div>
      <div class="pitch-numbers">
        <div class="pitch-num-group"><span class="png-label">${t('multiply_x')}</span>
        <div class="png-chips">${p.mul.map(v => `<span class="pchip mul" id="mul${v}">${v}</span>`).join('')}</div></div>
        <div class="pitch-num-group"><span class="png-label">${t('add_plus')}</span>
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
          <button class="btn-blue" onclick="emitRollDice('mul')">${t('roll_mul')}</button>
          <button class="btn-red" onclick="emitRollDice('add')">${t('roll_add')}</button>
          ` : ''}
          ${!isFieldingTeam && !gs.diceDone ? `<div style="color:var(--dim)">${t('waiting_roll')}</div>` : ''}
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
      <h1>${t('game_over')}</h1>
      <div class="final-score">
        <span style="color:var(--blue)">${gs.teams[0].name} ${gs.score[0]}</span>
        <span style="color:var(--dim)"> — </span>
        <span style="color:var(--red)">${gs.score[1]} ${gs.teams[1].name}</span>
      </div>
      <p style="color:var(--gold);font-size:1.3em;margin:12px 0">${fmtWins(gs.teams[winner].name)}${isWinner ? ' 🎉' : ''}</p>
      <button class="btn-gold" onclick="location.reload()" style="margin-top:16px">${t('new_game')}</button>
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
  const label = idx >= 0 ? outcomeLabel(idx) : text;
  rt.innerHTML = `<span style="color:${color}">${icon} ${label}</span>`;
  ol.classList.remove('show'); void ol.offsetHeight; ol.classList.add('show');
  setTimeout(() => ol.classList.remove('show'), 900);
  if (isRun || (idx >= 0 && OUTCOME_KEYS[idx] === 'HR')) confetti();
}

function showWCAnimation(wc) {
  const ol = document.getElementById('wcOverlay');
  // Server sends English card data; map back to client defs so it localizes too.
  const def = (typeof WILD_CARD_DEFS !== 'undefined') ? WILD_CARD_DEFS.find(d => d.name === wc.name) : null;
  const card = def || wc;
  document.getElementById('wcPlayCard').innerHTML = `
    <div class="wpc-icon">${wc.icon || card.icon}</div>
    <div class="wpc-name">${wcName(card)}</div>
    <div class="wpc-desc">${wcDesc(card)}</div>`;
  ol.classList.remove('show'); void ol.offsetHeight; ol.classList.add('show');
  setTimeout(() => ol.classList.remove('show'), 1000);
}
