function showDraftScreen(teams) {
  showScreen('draft');
  updateDraftUI(null);
}

function setPoolType(type) {
  clientState.poolType = type;
  document.querySelectorAll('#typeTabs button').forEach((b, i) => {
    b.classList.toggle('active', (type === 'bat' && i === 0) || (type === 'pitch' && i === 1));
  });
  updateDraftPool();
}

function setFilter(f) {
  clientState.posFilter = f;
  document.querySelectorAll('#filterBar button').forEach(b => {
    b.classList.toggle('active', b.dataset.f === f);
  });
  updateDraftPool();
}

function emitDraftPick(idx, type) {
  socket.emit('draftPick', {
    roomCode: clientState.roomCode,
    playerId: idx,
    type: type
  });
}

function updateDraftUI(draftState) {
  if (!draftState) return;
  const team = draftState.currentTeam;
  const tname = draftState.teams[team].name;
  const isMyTurn = clientState.playerSlot === team;

  document.getElementById('draftTurn').innerHTML =
    `<span class="tn" style="color:${team === 0 ? 'var(--blue)' : 'var(--red)'}">${tname}</span>'s pick${isMyTurn ? ' (YOU)' : ''}`;
  document.getElementById('draftPicksLeft').textContent =
    `${draftState.picksLeftInBlock} picks left in block`;

  // Render rosters
  let rhtml = '';
  for (let t = 0; t < 2; t++) {
    const isActive = t === team;
    const isMe = t === clientState.playerSlot;
    rhtml += `<div class="roster-panel ${isActive ? 'active' : ''}">
      <h3 style="color:${t === 0 ? 'var(--blue)' : 'var(--red)'}">${draftState.teams[t].name}${isMe ? ' (You)' : ''} (${draftState.teams[t].batters.length}B/${draftState.teams[t].pitchers.length}P)</h3>
      <div class="roster-list">`;
    draftState.teams[t].batters.forEach((bi) => {
      rhtml += `<div class="ri">${avatarHTML(BATTERS[bi].n, 22)}<span>${BATTERS[bi].n}</span><span class="rpos">${BATTERS[bi].p.join('/')}</span></div>`;
    });
    draftState.teams[t].pitchers.forEach((pi) => {
      rhtml += `<div class="ri">${avatarHTML(PITCHERS[pi].n, 22)}<span>${PITCHERS[pi].n}</span><span class="rpos">P</span></div>`;
    });
    rhtml += `</div></div>`;
  }
  document.getElementById('draftRosters').innerHTML = rhtml;

  // Store draft state for pool rendering
  clientState.draftState = draftState;
  updateDraftPool();

  const allDone = draftState.isComplete;
  const ddb = document.getElementById('draftDoneBtn');
  if (ddb) ddb.disabled = !allDone;
  document.getElementById('draftDoneWrap').classList.toggle('hidden', !allDone && draftState.draftTotal < 24);
}

function isBatterLockedClient(teams, teamIdx, bIdx) {
  const POSITIONS_UNIQUE = ['C','1B','2B','3B','SS'];
  const b = BATTERS[bIdx];
  const eligPos = b.p.filter(pp => POSITIONS_UNIQUE.includes(pp));
  if (eligPos.length === 0) return false;
  for (const pos of eligPos) {
    const count = teams[teamIdx].batters.filter(bi => BATTERS[bi].p.includes(pos)).length;
    if (count < 1) return false;
  }
  return true;
}

function updateDraftPool() {
  const ds = clientState.draftState;
  if (!ds) return;
  const team = ds.currentTeam;
  const isMyTurn = clientState.playerSlot === team;

  if (clientState.poolType === 'bat') {
    const positions = ['ALL', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH'];
    document.getElementById('filterBar').innerHTML = positions.map(p =>
      `<button data-f="${p}" class="${clientState.posFilter === p ? 'active' : ''}" onclick="setFilter('${p}')">${p}</button>`
    ).join('');
    document.getElementById('filterBar').style.display = 'flex';
  } else {
    document.getElementById('filterBar').style.display = 'none';
  }

  const allBatters = new Set([...ds.teams[0].batters, ...ds.teams[1].batters]);
  const allPitchers = new Set([...ds.teams[0].pitchers, ...ds.teams[1].pitchers]);

  let html = '';
  if (clientState.poolType === 'bat') {
    const teamFull = ds.teams[team].batters.length >= 9;
    BATTERS.forEach((b, i) => {
      if (clientState.posFilter !== 'ALL' && !b.p.includes(clientState.posFilter)) return;
      const isPicked = allBatters.has(i);
      const locked = !isPicked && !teamFull && isMyTurn && isBatterLockedClient(ds.teams, team, i);
      html += `<div class="pcard ${isPicked ? 'picked' : ''} ${locked ? 'locked' : ''}" ${!isPicked && !locked && !teamFull && isMyTurn ? `onclick="emitDraftPick(${i},'bat')"` : ''}>
        <div class="locked-label">Position Filled</div>
        <div class="pcard-header">${avatarHTML(b.n, 40)}<div><div class="pname">${b.n}</div><div class="ppos">${b.p.join(' / ')}</div></div></div>
        <canvas class="mini-wheel" id="mw${i}" width="120" height="120"></canvas>
        <div class="pstats"><span>BA <b>${b.ba.toFixed(3)}</b></span><span>OBP <b>${b.obp.toFixed(3)}</b></span><span>SLG <b>${b.slg.toFixed(3)}</b></span></div></div>`;
    });
  } else {
    const teamFull = ds.teams[team].pitchers.length >= 3;
    PITCHERS.forEach((p, i) => {
      const isPicked = allPitchers.has(i);
      html += `<div class="pcard ${isPicked ? 'picked' : ''}" ${!isPicked && !teamFull && isMyTurn ? `onclick="emitDraftPick(${i},'pitch')"` : ''}>
        <div class="pcard-header">${avatarHTML(p.n, 40)}<div><div class="pname">${p.n}</div><div class="ppos">Pitcher</div></div></div>
        <div class="pitch-nums"><div><span class="pn-label">Multiply</span><div class="pn-vals">${p.mul.map(v => `<span class="pn-chip mul">${v}</span>`).join('')}</div></div>
        <div style="margin-top:4px"><span class="pn-label">Add (+)</span><div class="pn-vals">${p.add.map(v => `<span class="pn-chip add">${v}</span>`).join('')}</div></div></div></div>`;
    });
  }
  document.getElementById('poolGrid').innerHTML = html;

  if (clientState.poolType === 'bat') {
    BATTERS.forEach((b, i) => {
      const c = document.getElementById('mw' + i);
      if (c) drawMiniWheel(c, b.deg);
    });
  }
}

function goToLineup() {
  socket.emit('goToLineup', { roomCode: clientState.roomCode });
  showScreen('lineup');
  renderLineups();
}
