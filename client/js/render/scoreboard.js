function renderScoreboard(gs) {
  const maxInn = Math.max(9, gs.inning);
  let html = `<table class="sb-table"><thead><tr><th></th>`;
  for (let i = 1; i <= maxInn; i++) html += `<th class="${i === gs.inning && !gs.gameOver ? 'current-inn' : ''}">${i}</th>`;
  html += `<th class="total">R</th></tr></thead><tbody>`;
  for (let t = 0; t < 2; t++) {
    html += `<tr><td class="team-name" style="color:${t === 0 ? 'var(--blue)' : 'var(--red)'}">${gs.teams[t].name}</td>`;
    for (let i = 0; i < maxInn; i++) {
      const s = gs.inningScores[t][i];
      html += `<td class="${i + 1 === gs.inning && !gs.gameOver ? 'current-inn' : ''}">${s !== undefined ? s : ''}</td>`;
    }
    html += `<td class="total">${gs.score[t]}</td></tr>`;
  }
  html += `</tbody></table>`;
  document.getElementById('scoreboard').innerHTML = html;
}

function renderBasesAndOuts(gs) {
  return `<div style="display:flex;align-items:center;justify-content:center;gap:20px">
    <div class="bases-display"><div class="diamond">
      <div class="base b1 ${gs.bases[0] ? 'occupied' : ''}"></div>
      <div class="base b2 ${gs.bases[1] ? 'occupied' : ''}"></div>
      <div class="base b3 ${gs.bases[2] ? 'occupied' : ''}"></div>
      <div class="home-plate"></div>
    </div></div>
    <div class="outs-display"><div>Outs</div>
      <span class="out-dot ${gs.outs >= 1 ? 'active' : ''}"></span>
      <span class="out-dot ${gs.outs >= 2 ? 'active' : ''}"></span>
    </div></div>`;
}
