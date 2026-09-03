let derbyParticipants = 3;

function showDerbyConfig() {
  showScreen('derbyConfig');
  renderDerbyConfig();
}

function renderDerbyConfig() {
  const isHost = clientState.playerSlot === 0;
  document.getElementById('derbyParticipantCount').textContent = derbyParticipants;
  document.getElementById('derbyMinus').disabled = !isHost || derbyParticipants <= 1;
  document.getElementById('derbyPlus').disabled = !isHost || derbyParticipants >= 5;
  document.getElementById('derbyStartBtn').disabled = !isHost;
  if (!isHost) {
    document.getElementById('derbyConfigStatus').textContent = t('waiting_host');
  } else {
    document.getElementById('derbyConfigStatus').textContent = '';
  }
}

function changeDerbyCount(delta) {
  derbyParticipants = Math.max(1, Math.min(5, derbyParticipants + delta));
  renderDerbyConfig();
  socket.emit('setDerbyParticipants', {
    roomCode: clientState.roomCode,
    count: derbyParticipants
  });
}

function startDerbyDraft() {
  socket.emit('startDerbyDraft', { roomCode: clientState.roomCode });
}

function showDerbyDraftScreen(data) {
  clientState.derbyDraftData = data;
  showScreen('derbyDraft');
  renderDerbyDraft();
}

function renderDerbyDraft() {
  const d = clientState.derbyDraftData;
  if (!d) return;

  const isMyTurn = clientState.playerSlot === d.currentTeam;
  const tname = d.teamNames[d.currentTeam];

  document.getElementById('derbyDraftTurn').innerHTML =
    `<span style="color:${d.currentTeam === 0 ? 'var(--blue)' : 'var(--red)'}">${tname}</span>${fmtPick('')}${isMyTurn ? t('you_caps') : ''}`;
  document.getElementById('derbyDraftProgress').textContent =
    fmtProgress(d.teams[0].length + d.teams[1].length, d.target * 2);

  let rhtml = '';
  for (let ti = 0; ti < 2; ti++) {
    const isMe = ti === clientState.playerSlot;
    rhtml += `<div class="derby-roster-panel">
      <h3 style="color:${ti === 0 ? 'var(--blue)' : 'var(--red)'}">${d.teamNames[ti]}${isMe ? t('you') : ''} — ${d.teams[ti].length}/${d.target}</h3>`;
    d.teams[ti].forEach(bi => {
      const b = BATTERS[bi];
      rhtml += `<div class="dri">${avatarHTML(nm(b), 22)}<span>${nm(b)}</span></div>`;
    });
    rhtml += '</div>';
  }
  document.getElementById('derbyDraftRosters').innerHTML = rhtml;

  const picked = new Set(d.picked);
  const teamFull = d.teams[d.currentTeam].length >= d.target;
  let phtml = '';
  BATTERS.forEach((b, i) => {
    const isPicked = picked.has(i);
    const canPick = !isPicked && !teamFull && isMyTurn;
    const hrPct = Math.round((0.25 + (b.slg - 0.350) * 0.8) * 100);
    const clampedPct = Math.max(20, Math.min(55, hrPct));
    phtml += `<div class="derby-pcard ${isPicked ? 'picked' : ''}" ${canPick ? `onclick="emitDerbyDraftPick(${i})"` : ''}>
      ${avatarHTML(nm(b), 40)}
      <div class="dp-name">${nm(b)}</div>
      <div class="dp-pos">${b.p.join(' / ')}</div>
      <div class="dp-slg">${t('slg')} ${b.slg.toFixed(3)}</div>
      <div class="dp-hr-pct">${fmtDerbyHR(clampedPct)}</div>
    </div>`;
  });
  document.getElementById('derbyDraftPool').innerHTML = phtml;
}

function emitDerbyDraftPick(batterIdx) {
  socket.emit('derbyDraftPick', {
    roomCode: clientState.roomCode,
    batterIdx
  });
}

let derbyWheelRot = 0;

function showDerbyScreen(ds) {
  clientState.derbyState = ds;
  showScreen('derby');
  renderDerby();
}

function renderDerby() {
  const ds = clientState.derbyState;
  if (!ds) return;

  if (ds.derbyOver) {
    renderDerbyGameOver(ds);
    return;
  }

  renderDerbyScoreboard(ds);
  renderDerbyStatus(ds);
  renderDerbyBatterPanel(ds);
}

function renderDerbyScoreboard(ds) {
  let html = '';
  for (let ti = 0; ti < 2; ti++) {
    const isActive = ti === ds.currentTeam;
    const hrs = ds.results[ti].totalHR + (ti === ds.currentTeam ? ds.currentHRs : 0);
    const dist = ds.results[ti].totalDistance + (ti === ds.currentTeam ? ds.currentDistances.reduce((a, b) => a + b, 0) : 0);
    html += `<div class="derby-team-score ${isActive ? 'active' : ''}">
      <div class="dts-name" style="color:${ti === 0 ? 'var(--blue)' : 'var(--red)'}">${ds.teams[ti].name}</div>
      <div class="dts-hr">${fmtHR(hrs)}</div>
      <div class="dts-dist">${fmtFtTotal(dist)}</div>
    </div>`;
  }
  document.getElementById('derbyScoreboard').innerHTML = html;
}

function renderDerbyStatus(ds) {
  const batter = ds.currentBatterOrder + 1;
  const total = ds.participantsPerTeam;
  document.getElementById('derbyStatus').innerHTML =
    `<b>${ds.teams[ds.currentTeam].name}</b> — ${fmtBatterOf(batter, total)}`;
}

function renderDerbyBatterPanel(ds) {
  const team = ds.currentTeam;
  const batterIdx = ds.teams[team].batters[ds.currentBatterOrder];
  const b = BATTERS[batterIdx];
  const isMyTurn = clientState.playerSlot === team;

  const swingsLeft = ds.maxSwings - ds.swingCount;
  const hrPct = Math.round((0.25 + (b.slg - 0.350) * 0.8) * 100);
  const clampedPct = Math.max(20, Math.min(55, hrPct));

  let trackerHtml = `<div class="derby-hr-tracker">`;
  for (let i = 0; i < ds.currentHRs; i++) {
    const dist = ds.currentDistances[i] || 0;
    trackerHtml += `<div class="derby-hr-dot hit" title="${fmtFt(dist)}">💣</div>`;
  }
  trackerHtml += '</div>';

  const hrDeg = clampedPct * 3.6;
  const missDeg = 360 - hrDeg;

  document.getElementById('derbyBatterPanel').innerHTML = `
    <div class="derby-batter-panel">
      <div class="derby-batter-info">${avatarHTML(nm(b))}<div class="player-detail">
        <h3>${nm(b)}</h3>
        <div class="pd-pos">${b.p.join(' / ')}</div>
        <div class="pd-stats">${t('slg')} ${b.slg.toFixed(3)} | ${fmtDerbyHR(clampedPct)}</div>
      </div></div>

      <div class="derby-swing-counter">
        <div class="dsc-label">${ds.bonusMode ? t('bonus_swings') : t('swings_left')}</div>
        <div class="dsc-count">${ds.bonusMode ? t('bonus') : swingsLeft}</div>
        ${ds.bonusMode ? `<div class="dsc-bonus">${t('bonus_note')}</div>` : ''}
      </div>

      <div style="text-align:center;font-size:1.2em;font-weight:700;color:var(--gold);margin:4px 0">
        ${fmtHR(ds.currentHRs)}
      </div>
      ${trackerHtml}

      <div class="derby-wheel-area">
        <div class="derby-wheel-container">
          <div class="wheel-pointer"></div>
          <canvas id="derbyWheel" width="480" height="480" style="width:240px;height:240px;transition:transform 3s cubic-bezier(.17,.67,.12,.99)"></canvas>
        </div>
        <div class="derby-result" id="derbyResult"></div>
        ${isMyTurn && !ds.swingDone ? `<button class="btn-gold" id="derbySwingBtn" onclick="emitDerbySwing()">${t('swing_btn')}</button>` : ''}
        ${!isMyTurn && !ds.swingDone ? `<div style="color:var(--dim);text-align:center">${t('waiting_swing')}</div>` : ''}
      </div>

      ${renderDerbyResultsSoFar(ds)}
    </div>`;

  drawDerbyWheel('derbyWheel', [hrDeg, missDeg]);
  const wh = document.getElementById('derbyWheel');
  if (wh) {
    wh.style.transition = 'none';
    wh.style.transform = `rotate(${derbyWheelRot}deg)`;
    void wh.offsetHeight;
    wh.style.transition = 'transform 3s cubic-bezier(.17,.67,.12,.99)';
  }
}

function renderDerbyResultsSoFar(ds) {
  let html = '';
  for (let ti = 0; ti < 2; ti++) {
    if (ds.results[ti].batters.length === 0) continue;
    html += `<div class="derby-batter-results"><h4>${fmtResultsTitle(ds.teams[ti].name)}</h4>`;
    ds.results[ti].batters.forEach(br => {
      const b = BATTERS[br.batterIdx];
      html += `<div class="derby-result-row">
        ${avatarHTML(nm(b), 24)}
        <span class="drr-name">${nm(b)}</span>
        <span class="drr-hrs">${fmtHR(br.hrs)}</span>
        <span class="drr-dist">${fmtDistLine(br.totalDistance, br.maxDistance)}</span>
      </div>`;
    });
    html += '</div>';
  }
  return html;
}

function drawDerbyWheel(canvasId, deg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  const cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 4;
  ctx.clearRect(0, 0, w, h);

  const colors = ['#e74c3c', '#2a3a55'];
  const labels = [t('wheel_hr'), t('wheel_nohomer')];
  let start = -Math.PI / 2;

  deg.forEach((d, i) => {
    if (d <= 0) return;
    const angle = d * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (d >= 20) {
      const mid = start + angle / 2, lr = r * 0.6;
      const lx = cx + Math.cos(mid) * lr, ly = cy + Math.sin(mid) * lr;
      ctx.save();
      ctx.translate(lx, ly);
      let rot = mid + Math.PI / 2;
      if (mid > Math.PI / 2 && mid < Math.PI * 1.5) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${d >= 60 ? 16 : 12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], 0, 0);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fillText(Math.round(d / 3.6) + '%', 0, 16);
      ctx.restore();
    }
    start += angle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function emitDerbySwing() {
  socket.emit('derbySwing', { roomCode: clientState.roomCode });
  const btn = document.getElementById('derbySwingBtn');
  if (btn) btn.disabled = true;
}

function handleDerbySwingResult(data) {
  clientState.derbyState = data.derbyState;

  const hrDeg = data.hrDeg;
  let targetAngle;
  if (data.isHR) {
    targetAngle = hrDeg[0] * Math.random();
  } else {
    targetAngle = hrDeg[0] + hrDeg[1] * Math.random();
  }
  const targetMod = (360 - targetAngle) % 360;
  const currentMod = derbyWheelRot % 360;
  let delta = ((targetMod - currentMod) + 360) % 360;
  if (delta < 30) delta += 360;
  const extraSpins = 3 + Math.floor(Math.random() * 3);
  derbyWheelRot += delta + extraSpins * 360;

  const wh = document.getElementById('derbyWheel');
  if (wh) wh.style.transform = `rotate(${derbyWheelRot}deg)`;

  setTimeout(() => {
    const resultEl = document.getElementById('derbyResult');
    if (data.isHR) {
      resultEl.innerHTML = `<span class="hr-text">💣 ${t('home_run_excl')}</span><span class="distance">${fmtFt(data.distance)}</span>`;
      fireResultAnim(t('home_run_excl'), -1, true);
    } else {
      resultEl.innerHTML = `<span class="miss-text">${t('no_homer')}</span>`;
    }

    setTimeout(() => {
      if (data.turnOver) {
        if (resultEl) resultEl.innerHTML += `<div style="color:var(--dim);font-size:.6em;margin-top:6px">${t('turn_complete')}</div>`;
      } else {
        socket.emit('derbyNextSwing', { roomCode: clientState.roomCode });
      }
    }, 800);
  }, 3200);
}

function renderDerbyGameOver(ds) {
  const winner = ds.results[0].totalHR > ds.results[1].totalHR ? 0 :
                 ds.results[1].totalHR > ds.results[0].totalHR ? 1 :
                 ds.results[0].totalDistance > ds.results[1].totalDistance ? 0 :
                 ds.results[1].totalDistance > ds.results[0].totalDistance ? 1 : -1;

  const isWinner = clientState.playerSlot === winner;
  confetti();

  document.getElementById('derbyStatus').innerHTML = '';
  document.getElementById('derbyScoreboard').innerHTML = '';

  let breakdownHtml = `<table><thead><tr><th>${t('th_batter')}</th><th>${t('th_hrs')}</th><th>${t('th_maxdist')}</th><th>${t('th_totaldist')}</th></tr></thead><tbody>`;
  for (let ti = 0; ti < 2; ti++) {
    breakdownHtml += `<tr><td colspan="4" style="color:${ti === 0 ? 'var(--blue)' : 'var(--red)'};font-weight:700;padding-top:8px">${ds.teams[ti].name}</td></tr>`;
    ds.results[ti].batters.forEach(br => {
      const b = BATTERS[br.batterIdx];
      breakdownHtml += `<tr><td>${nm(b)}</td><td style="color:var(--gold);font-weight:700">${br.hrs}</td><td>${fmtFt(br.maxDistance)}</td><td>${fmtFt(br.totalDistance)}</td></tr>`;
    });
  }
  breakdownHtml += '</tbody></table>';

  const tieNote = ds.results[0].totalHR === ds.results[1].totalHR ?
    `<div style="color:var(--dim);font-size:.8em;margin-top:6px">${t('tie_note')}</div>` : '';

  document.getElementById('derbyBatterPanel').innerHTML = `
    <div class="derby-over-panel">
      <h1>${t('derby_over')}</h1>
      <div class="derby-final">
        <span style="color:var(--blue)">${ds.teams[0].name} ${ds.results[0].totalHR}</span>
        <span style="color:var(--dim)"> — </span>
        <span style="color:var(--red)">${ds.results[1].totalHR} ${ds.teams[1].name}</span>
      </div>
      ${winner >= 0 ? `<p style="color:var(--gold);font-size:1.3em;margin:12px 0">${fmtWins(ds.teams[winner].name)}${isWinner ? ' 🎉' : ''}</p>` : `<p style="color:var(--gold);font-size:1.3em">${t('tie')}</p>`}
      ${tieNote}
      <div class="derby-breakdown">${breakdownHtml}</div>
      <button class="btn-gold" onclick="location.reload()" style="margin-top:16px">${t('new_game')}</button>
    </div>`;
}
