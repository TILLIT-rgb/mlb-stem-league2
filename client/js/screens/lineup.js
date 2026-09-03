function renderLineups() {
  const gs = clientState.gameState || (clientState.draftState && { teams: clientState.draftState.teams.map(t => ({
    ...t, lineup: [...t.batters], activePitcher: 0
  }))});
  if (!gs) return;
  const mySlot = clientState.playerSlot;
  let html = '';
  gs.teams.forEach((tm, ti) => {
    const isMe = ti === mySlot;
    html += `<div class="lineup-team">
      <h2 style="color:${ti === 0 ? 'var(--blue)' : 'var(--red)'}">${tm.name}${isMe ? t('you') : ''}${t('order_suffix')}</h2>
      <div class="lineup-slots">`;
    const lineup = tm.lineup || tm.batters;
    lineup.forEach((bi, si) => {
      const b = BATTERS[bi];
      html += `<div class="lineup-slot">
        <div class="slot-num">${si + 1}</div>${avatarHTML(nm(b), 36)}
        <div class="slot-name">${nm(b)} <span style="color:var(--gold);font-size:.8em">${b.p.join('/')}</span></div>
        <div class="slot-arrows">
          ${isMe && si > 0 ? `<button class="btn-sm" onclick="moveSlot(${ti},${si},-1)">▲</button>` : ''}
          ${isMe && si < lineup.length - 1 ? `<button class="btn-sm" onclick="moveSlot(${ti},${si},1)">▼</button>` : ''}
        </div></div>`;
    });
    html += `</div>`;
    if (isMe) {
      html += `<div class="pitcher-select"><label style="color:var(--dim);font-size:.85em">${t('starting_pitcher')}</label>
        <select onchange="setPitcher(${ti},this.value)">`;
      tm.pitchers.forEach((pi, i) => {
        html += `<option value="${i}" ${i === (tm.activePitcher || 0) ? 'selected' : ''}>${nm(PITCHERS[pi])}</option>`;
      });
      html += `</select></div>`;
    }
    html += `</div>`;
  });
  document.getElementById('lineupTeams').innerHTML = html;
}

function moveSlot(ti, si, dir) {
  // Build lineup from current draft state
  const gs = clientState.gameState || { teams: clientState.draftState.teams.map(t => ({
    ...t, lineup: t.lineup || [...t.batters], activePitcher: t.activePitcher || 0
  }))};
  const arr = gs.teams[ti].lineup;
  const tmp = arr[si]; arr[si] = arr[si + dir]; arr[si + dir] = tmp;
  // Send to server
  socket.emit('updateLineup', { roomCode: clientState.roomCode, lineup: arr });
  // Update local for immediate feedback
  if (clientState.draftState) {
    clientState.draftState.teams[ti].lineup = arr;
  }
  renderLineups();
}

function setPitcher(ti, val) {
  socket.emit('setPitcher', { roomCode: clientState.roomCode, pitcherIdx: parseInt(val) });
}

function playerReady() {
  socket.emit('ready', { roomCode: clientState.roomCode });
  document.getElementById('readyBtn').disabled = true;
  document.getElementById('readyBtn').textContent = t('waiting_opp');
}
