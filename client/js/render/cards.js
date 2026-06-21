function renderWCHand(gs, teamIdx, timing, WILD_CARD_DEFS, BATTERS, PITCHERS) {
  const wcs = gs.teams[teamIdx].wc;
  if (wcs.length === 0) return '';
  const bt = gs.half;
  const ft = 1 - gs.half;
  let html = `<div class="wc-section"><h4>${gs.teams[teamIdx].name}'s Wild Cards</h4><div class="wc-hand" id="wcHand${teamIdx}">`;
  wcs.forEach((wi, i) => {
    const wc = WILD_CARD_DEFS[wi];
    const canPlay = wc.canPlay(gs, timing);
    const isMyTiming = (wc.type === 'bat' && teamIdx === bt) || (wc.type === 'pitch' && teamIdx === ft);
    const isMyCard = teamIdx === clientState.playerSlot;
    const playable = canPlay && isMyTiming && isMyCard;
    html += `<div class="wc-card ${playable ? 'playable' : ''}" ${playable ? `onclick="emitPlayWildCard(${i},'${timing}')"` : ''}>
      <div class="wc-icon">${wc.icon}</div>
      <div class="wc-name">${wc.name}</div>
      <span class="wc-type ${wc.type}">${wc.type === 'bat' ? 'BAT' : 'PITCH'}</span>
      <div class="wc-desc">${wc.desc}</div>
      <div class="tap-label">TAP TO PLAY</div></div>`;
  });
  html += `</div></div>`;
  return html;
}
