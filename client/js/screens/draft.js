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
    `<span class="tn" style="color:${team === 0 ? 'var(--blue)' : 'var(--red)'}">${tname}</span>${fmtPick('')}${isMyTurn ? t('you_caps') : ''}`;
  document.getElementById('draftPicksLeft').textContent = fmtPicksLeft(draftState.picksLeftInBlock);

  // Render rosters
  let rhtml = '';
  for (let ti = 0; ti < 2; ti++) {
    const isActive = ti === team;
    const isMe = ti === clientState.playerSlot;
    rhtml += `<div class="roster-panel ${isActive ? 'active' : ''}">
      <h3 style="color:${ti === 0 ? 'var(--blue)' : 'var(--red)'}">${draftState.teams[ti].name}${isMe ? t('you') : ''} (${draftState.teams[ti].batters.length}B/${draftState.teams[ti].pitchers.length}P)</h3>
      <div class="roster-list">`;
    draftState.teams[ti].batters.forEach((bi) => {
      rhtml += `<div class="ri">${avatarHTML(nm(BATTERS[bi]), 22)}<span>${nm(BATTERS[bi])}</span><span class="rpos">${BATTERS[bi].p.join('/')}</span></div>`;
    });
    draftState.teams[ti].pitchers.forEach((pi) => {
      rhtml += `<div class="ri">${avatarHTML(nm(PITCHERS[pi]), 22)}<span>${nm(PITCHERS[pi])}</span><span class="rpos">P</span></div>`;
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
  const POS_UNIQUE = ['C','1B','2B','3B','SS'];
  const b = BATTERS[bIdx];
  const eligPos = b.p.filter(pp => POS_UNIQUE.includes(pp));
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
      `<button data-f="${p}" class="${clientState.posFilter === p ? 'active' : ''}" onclick="setFilter('${p}')">${p === 'ALL' ? t('all') : p}</button>`
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
        <div class="locked-label">${t('position_filled')}</div>
        <div class="pcard-header">${avatarHTML(nm(b), 40)}<div><div class="pname">${nm(b)}</div><div class="ppos">${b.p.join(' / ')}</div></div></div>
        <canvas class="mini-wheel" id="mw${i}" width="120" height="120"></canvas>
        <div class="pstats"><span>${t('ba')} <b>${b.ba.toFixed(3)}</b></span><span>${t('obp')} <b>${b.obp.toFixed(3)}</b></span><span>${t('slg')} <b>${b.slg.toFixed(3)}</b></span></div></div>`;
    });
  } else {
    const teamFull = ds.teams[team].pitchers.length >= 3;
    PITCHERS.forEach((p, i) => {
      const isPicked = allPitchers.has(i);
      html += `<div class="pcard ${isPicked ? 'picked' : ''}" ${!isPicked && !teamFull && isMyTurn ? `onclick="emitDraftPick(${i},'pitch')"` : ''}>
        <div class="pcard-header">${avatarHTML(nm(p), 40)}<div><div class="pname">${nm(p)}</div><div class="ppos">${t('pitcher')}</div></div></div>
        <div class="pitch-nums"><div><span class="pn-label">${t('multiply')}</span><div class="pn-vals">${p.mul.map(v => `<span class="pn-chip mul">${v}</span>`).join('')}</div></div>
        <div style="margin-top:4px"><span class="pn-label">${t('add_plus')}</span><div class="pn-vals">${p.add.map(v => `<span class="pn-chip add">${v}</span>`).join('')}</div></div></div></div>`;
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
