function nameHash(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i);
  return Math.abs(h);
}

function seededRand(seed, i) {
  let s = seed * 2654435761 + i * 1597334677;
  s = ((s >>> 16) ^ s) * 0x45d9f3b;
  s = ((s >>> 16) ^ s) * 0x45d9f3b;
  return ((s >>> 16) ^ s) >>> 0;
}

function avatarHTML(name, size) {
  size = size || 56;
  const h = nameHash(name);
  const r = (i) => seededRand(h, i);
  const skinTones = ['#FDDBB4','#F5C7A1','#E8B78B','#D4956B','#C68642','#A0674B','#8D5524','#6B3F1F'];
  const hairColors = ['#1a1a1a','#3b2314','#4a2912','#6b3a2a','#2c1b0e','#c9882e','#8b5e3c','#2a2a2a'];
  const capColors = ['#c43c2d','#2a7de1','#1a5e35','#e8b93c','#333','#e67e22','#8e44ad','#16a085'];
  const skin = skinTones[r(0) % skinTones.length], hairC = hairColors[r(1) % hairColors.length];
  const hasCap = r(2) % 3 !== 0, capC = capColors[r(3) % capColors.length];
  const eyeStyle = r(4) % 4, mouthStyle = r(5) % 5, browStyle = r(6) % 3, hasBeard = r(7) % 5 === 0, hairStyle = r(8) % 4;
  const earW = size * .1, earH = size * .12, cx = size / 2, cy = size / 2, faceR = size * .38;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="flex-shrink:0">`;
  svg += `<circle cx="${cx}" cy="${cy * 1.05}" r="${faceR}" fill="${skin}"/>`;
  svg += `<ellipse cx="${cx - faceR + 1}" cy="${cy * 1.05}" rx="${earW}" ry="${earH}" fill="${skin}"/>`;
  svg += `<ellipse cx="${cx + faceR - 1}" cy="${cy * 1.05}" rx="${earW}" ry="${earH}" fill="${skin}"/>`;
  if (hasCap) {
    svg += `<ellipse cx="${cx}" cy="${cy * .7}" rx="${faceR * 1.2}" ry="${faceR * .55}" fill="${capC}"/>`;
    svg += `<rect x="${cx - faceR * 1.3}" y="${cy * .68}" width="${faceR * 2.6}" height="${size * .06}" rx="2" fill="${capC}" opacity=".8"/>`;
    svg += `<rect x="${cx - faceR * .3}" y="${cy * .48}" width="${faceR * 1.4}" height="${size * .06}" rx="2" fill="${capC}"/>`;
  } else {
    if (hairStyle === 0) svg += `<ellipse cx="${cx}" cy="${cy * .72}" rx="${faceR * 1.05}" ry="${faceR * .55}" fill="${hairC}"/>`;
    else if (hairStyle === 1) svg += `<rect x="${cx - faceR * .9}" y="${cy * .4}" width="${faceR * 1.8}" height="${faceR * .9}" rx="${faceR * .4}" fill="${hairC}"/>`;
    else if (hairStyle === 2) svg += `<ellipse cx="${cx}" cy="${cy * .65}" rx="${faceR * .95}" ry="${faceR * .4}" fill="${hairC}"/>`;
    else svg += `<ellipse cx="${cx}" cy="${cy * .7}" rx="${faceR * 1.1}" ry="${faceR * .5}" fill="${hairC}"/>`;
  }
  const eyeY = cy * 1.02, eyeL = cx - faceR * .32, eyeR2 = cx + faceR * .32, eyeS = size * .04;
  if (eyeStyle === 0) svg += `<circle cx="${eyeL}" cy="${eyeY}" r="${eyeS}" fill="#222"/><circle cx="${eyeR2}" cy="${eyeY}" r="${eyeS}" fill="#222"/><circle cx="${eyeL + 1}" cy="${eyeY - 1}" r="${eyeS * .35}" fill="#fff"/><circle cx="${eyeR2 + 1}" cy="${eyeY - 1}" r="${eyeS * .35}" fill="#fff"/>`;
  else if (eyeStyle === 1) svg += `<ellipse cx="${eyeL}" cy="${eyeY}" rx="${eyeS * 1.2}" ry="${eyeS * .7}" fill="#222"/><ellipse cx="${eyeR2}" cy="${eyeY}" rx="${eyeS * 1.2}" ry="${eyeS * .7}" fill="#222"/>`;
  else if (eyeStyle === 2) svg += `<circle cx="${eyeL}" cy="${eyeY}" r="${eyeS * 1.1}" fill="#fff" stroke="#222" stroke-width="1"/><circle cx="${eyeL}" cy="${eyeY}" r="${eyeS * .55}" fill="#222"/><circle cx="${eyeR2}" cy="${eyeY}" r="${eyeS * 1.1}" fill="#fff" stroke="#222" stroke-width="1"/><circle cx="${eyeR2}" cy="${eyeY}" r="${eyeS * .55}" fill="#222"/>`;
  else svg += `<line x1="${eyeL - eyeS}" y1="${eyeY}" x2="${eyeL + eyeS}" y2="${eyeY}" stroke="#222" stroke-width="2" stroke-linecap="round"/><line x1="${eyeR2 - eyeS}" y1="${eyeY}" x2="${eyeR2 + eyeS}" y2="${eyeY}" stroke="#222" stroke-width="2" stroke-linecap="round"/>`;
  const browY = eyeY - size * .08;
  if (browStyle === 0) svg += `<line x1="${eyeL - eyeS}" y1="${browY}" x2="${eyeL + eyeS * 1.2}" y2="${browY - 2}" stroke="#222" stroke-width="1.5" stroke-linecap="round"/><line x1="${eyeR2 - eyeS * 1.2}" y1="${browY - 2}" x2="${eyeR2 + eyeS}" y2="${browY}" stroke="#222" stroke-width="1.5" stroke-linecap="round"/>`;
  else if (browStyle === 1) svg += `<line x1="${eyeL - eyeS}" y1="${browY + 1}" x2="${eyeL + eyeS}" y2="${browY - 2}" stroke="#222" stroke-width="1.8" stroke-linecap="round"/><line x1="${eyeR2 - eyeS}" y1="${browY - 2}" x2="${eyeR2 + eyeS}" y2="${browY + 1}" stroke="#222" stroke-width="1.8" stroke-linecap="round"/>`;
  else svg += `<line x1="${eyeL - eyeS}" y1="${browY}" x2="${eyeL + eyeS}" y2="${browY}" stroke="#222" stroke-width="1.5" stroke-linecap="round"/><line x1="${eyeR2 - eyeS}" y1="${browY}" x2="${eyeR2 + eyeS}" y2="${browY}" stroke="#222" stroke-width="1.5" stroke-linecap="round"/>`;
  const mY = cy * 1.18;
  if (mouthStyle === 0) svg += `<path d="M${cx - size * .06},${mY} Q${cx},${mY + size * .06} ${cx + size * .06},${mY}" stroke="#222" stroke-width="1.5" fill="none"/>`;
  else if (mouthStyle === 1) svg += `<line x1="${cx - size * .05}" y1="${mY + 2}" x2="${cx + size * .05}" y2="${mY + 2}" stroke="#222" stroke-width="1.5" stroke-linecap="round"/>`;
  else if (mouthStyle === 2) svg += `<path d="M${cx - size * .07},${mY} Q${cx},${mY + size * .08} ${cx + size * .07},${mY}" fill="#c0392b" stroke="#222" stroke-width=".8"/>`;
  else if (mouthStyle === 3) svg += `<ellipse cx="${cx}" cy="${mY + 2}" rx="${size * .04}" ry="${size * .03}" fill="#222"/>`;
  else svg += `<path d="M${cx - size * .04},${mY + 1} Q${cx},${mY + size * .04} ${cx + size * .04},${mY + 1}" stroke="#222" stroke-width="1.3" fill="none"/>`;
  if (hasBeard) svg += `<path d="M${cx - faceR * .5},${mY - 2} Q${cx - faceR * .4},${mY + size * .12} ${cx},${mY + size * .15} Q${cx + faceR * .4},${mY + size * .12} ${cx + faceR * .5},${mY - 2}" fill="${hairC}" opacity=".5"/>`;
  svg += `</svg>`;
  return svg;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function confetti() {
  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#e67e22', '#f1c40f', '#9b59b6'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.cssText = `left:${Math.random() * 100}vw;top:-10px;background:${colors[i % colors.length]};width:${6 + Math.random() * 6}px;height:${6 + Math.random() * 6}px;border-radius:${Math.random() > .5 ? '50%' : '0'};animation:confFall ${1.5 + Math.random() * 2}s ease-in forwards;animation-delay:${Math.random() * .3}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
  if (!document.getElementById('confCSS')) {
    const s = document.createElement('style');
    s.id = 'confCSS';
    s.textContent = `@keyframes confFall{to{transform:translateY(110vh) rotate(${360 + Math.random() * 360}deg);opacity:0}}`;
    document.head.appendChild(s);
  }
}
