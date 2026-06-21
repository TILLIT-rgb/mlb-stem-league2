function drawMiniWheel(canvas, deg) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 2;
  ctx.clearRect(0, 0, w, h);
  let start = -Math.PI / 2;
  deg.forEach((d, i) => {
    if (d <= 0) return;
    const angle = d * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle); ctx.closePath();
    ctx.fillStyle = OUTCOME_COLORS[i]; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.stroke();
    start += angle;
  });
}

function drawGameWheel(canvasId, deg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(cx, cy) - 4;
  ctx.clearRect(0, 0, w, h);
  let start = -Math.PI / 2;
  deg.forEach((d, i) => {
    if (d <= 0) return;
    const angle = d * Math.PI / 180;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + angle); ctx.closePath();
    ctx.fillStyle = OUTCOME_COLORS[i]; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    if (d >= 12) {
      const mid = start + angle / 2, lr = r * 0.65;
      const lx = cx + Math.cos(mid) * lr, ly = cy + Math.sin(mid) * lr;
      ctx.save(); ctx.translate(lx, ly);
      let rot = mid + Math.PI / 2;
      if (mid > Math.PI / 2 && mid < Math.PI * 1.5) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = '#fff'; ctx.font = `bold ${d >= 25 ? 13 : 10}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(OUTCOME_KEYS[i], 0, 0);
      if (d >= 30) { ctx.font = '9px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(Math.round(d / 3.6) + '%', 0, 13); }
      ctx.restore();
    }
    start += angle;
  });
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
}
