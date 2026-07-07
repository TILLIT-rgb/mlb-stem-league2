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
    document.getElementById('derbyConfigStatus').textContent = 'Waiting for host to configure...';
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
    `<span style="color:${d.currentTeam === 0 ? 'var(--blue)' : 'var(--red)'}">${tname}</span>'s pick${isMyTurn ? ' (YOU)' : ''}`;
  document.getElementById('derbyDraftProgress').textContent =
    `${d.teams[0].length + d.teams[1].length} / ${d.target * 2} batters picked`;

  let rhtml = '';
  for (let t = 0; t < 2; t++) {
    const isMe = t === clientState.playerSlot;
    rhtml += `<div class="derby-roster-panel">
      <h3 style="color:${t === 0 ? 'var(--blue)' : 'var(--red)'}">${d.teamNames[t]}${isMe ? ' (You)' : ''} — ${d.teams[t].length}/${d.target}</h3>`;
    d.teams[t].forEach(bi => {
      const b = BATTERS[bi];
      rhtml += `<div class="dri">${avatarHTML(b.n, 22)}<span>${b.n}</span></div>`;
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
      ${avatarHTML(b.n, 40)}
      <div class="dp-name">${b.n}</div>
      <div class="dp-pos">${b.p.join(' / ')}</div>
      <div class="dp-slg">SLG ${b.slg.toFixed(3)}</div>
      <div class="dp-hr-pct">Derby HR: ~${clampedPct}%</div>
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
  for (let t = 0; t < 2; t++) {
    const isActive = t === ds.currentTeam;
    html += `<div class="derby-team-score ${isActive ? 'active' : ''}">
      <div class="dts-name" style="color:${t === 0 ? 'var(--blue)' : 'var(--red)'}">${ds.teams[t].name}</div>
      <div class="dts-hr">${ds.results[t].totalHR + (t === ds.currentTeam ? ds.currentHRs : 0)} HR</div>
      <div class="dts-dist">${ds.results[t].totalDistance + (t === ds.currentTeam ? ds.currentDistances.reduce((a, b) => a + b, 0) : 0)} ft total</div>
    </div>`;
  }
  document.getElementById('derbyScoreboard').innerHTML = html;
}

function renderDerbyStatus(ds) {
  const batter = ds.currentBatterOrder + 1;
  const total = ds.participantsPerTeam;
  document.getElementById('derbyStatus').innerHTML =
    `<b>${ds.teams[ds.currentTeam].name}</b> — Batter ${batter} of ${total}`;
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
    trackerHtml += `<div class="derby-hr-dot hit" title="${dist} ft">💣</div>`;
  }
  trackerHtml += '</div>';

  const hrDeg = clampedPct * 3.6;
  const missDeg = 360 - hrDeg;

  document.getElementById('derbyBatterPanel').innerHTML = `
    <div class="derby-batter-panel">
      <div class="derby-batter-info">${avatarHTML(b.n)}<div class="player-detail">
        <h3>${b.n}</h3>
        <div class="pd-pos">${b.p.join(' / ')}</div>
        <div class="pd-stats">SLG ${b.slg.toFixed(3)} | Derby HR ~${clampedPct}%</div>
      </div></div>

      <div class="derby-swing-counter">
        <div class="dsc-label">${ds.bonusMode ? 'BONUS SWINGS' : 'Swings Remaining'}</div>
        <div class="dsc-count">${ds.bonusMode ? '♾️ BONUS' : swingsLeft}</div>
        ${ds.bonusMode ? '<div class="dsc-bonus">Homer on last swing! Keep going until you miss!</div>' : ''}
      </div>

      <div style="text-align:center;font-size:1.2em;font-weight:700;color:var(--gold);margin:4px 0">
        ${ds.currentHRs} HR${ds.currentHRs !== 1 ? 's' : ''}
      </div>
      ${trackerHtml}

      <div class="derby-wheel-area">
        <div class="derby-wheel-container">
          <div class="wheel-pointer"></div>
          <canvas id="derbyWheel" width="480" height="480" style="width:240px;height:240px;transition:transform 3s cubic-bezier(.17,.67,.12,.99)"></canvas>
        </div>
        <div class="derby-result" id="derbyResult"></div>
        ${isMyTurn && !ds.swingDone ? '<button class="btn-gold" id="derbySwingBtn" onclick="emitDerbySwing()">⚾ Swing!</button>' : ''}
        ${!isMyTurn && !ds.swingDone ? '<div style="color:var(--dim);text-align:center">Waiting for opponent to swing...</div>' : ''}
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
  for (let t = 0; t < 2; t++) {
    if (ds.results[t].batters.length === 0) continue;
    html += `<div class="derby-batter-results"><h4>${ds.teams[t].name} Results</h4>`;
    ds.results[t].batters.forEach(br => {
      const b = BATTERS[br.batterIdx];
      html += `<div class="derby-result-row">
        ${avatarHTML(b.n, 24)}
        <span class="drr-name">${b.n}</span>
        <span class="drr-hrs">${br.hrs} HR</span>
        <span class="drr-dist">${br.totalDistance} ft${br.maxDistance ? ' (max ' + br.maxDistance + ')' : ''}</span>
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
  const labels = ['HOME RUN', 'NO HOMER'];
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
      resultEl.innerHTML = `<span class="hr-text">💣 HOME RUN!</span><span class="distance">${data.distance} ft</span>`;
      fireResultAnim('HOME RUN!', -1, true);
    } else {
      resultEl.innerHTML = `<span class="miss-text">No Homer</span>`;
    }

    setTimeout(() => {
      if (data.turnOver) {
        if (resultEl) resultEl.innerHTML += '<div style="color:var(--dim);font-size:.6em;margin-top:6px">Turn complete!</div>';
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

  let breakdownHtml = '<table><thead><tr><th>Batter</th><th>HRs</th><th>Max Dist</th><th>Total Dist</th></tr></thead><tbody>';
  for (let t = 0; t < 2; t++) {
    breakdownHtml += `<tr><td colspan="4" style="color:${t === 0 ? 'var(--blue)' : 'var(--red)'};font-weight:700;padding-top:8px">${ds.teams[t].name}</td></tr>`;
    ds.results[t].batters.forEach(br => {
      const b = BATTERS[br.batterIdx];
      breakdownHtml += `<tr><td>${b.n}</td><td style="color:var(--gold);font-weight:700">${br.hrs}</td><td>${br.maxDistance} ft</td><td>${br.totalDistance} ft</td></tr>`;
    });
  }
  breakdownHtml += '</tbody></table>';

  const tieNote = ds.results[0].totalHR === ds.results[1].totalHR ?
    '<div style="color:var(--dim);font-size:.8em;margin-top:6px">Tied on HRs — won by total distance!</div>' : '';

  document.getElementById('derbyBatterPanel').innerHTML = `
    <div class="derby-over-panel">
      <h1>🏆 Derby Over!</h1>
      <div class="derby-final">
        <span style="color:var(--blue)">${ds.teams[0].name} ${ds.results[0].totalHR}</span>
        <span style="color:var(--dim)"> — </span>
        <span style="color:var(--red)">${ds.results[1].totalHR} ${ds.teams[1].name}</span>
      </div>
      ${winner >= 0 ? `<p style="color:var(--gold);font-size:1.3em;margin:12px 0">${ds.teams[winner].name} wins!${isWinner ? ' 🎉' : ''}</p>` : '<p style="color:var(--gold);font-size:1.3em">It\'s a tie!</p>'}
      ${tieNote}
      <div class="derby-breakdown">${breakdownHtml}</div>
      <button class="btn-gold" onclick="location.reload()" style="margin-top:16px">New Game</button>
    </div>`;
}
