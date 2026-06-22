const { BATTERS, OUTCOME_KEYS } = require('../data/batters');
const { PITCHERS } = require('../data/pitchers');
const { WILD_CARD_DEFS } = require('../data/wildcards');

function initGameState(teams) {
  return {
    teams: teams.map(t => ({
      ...t,
      wc: [randomWC(), randomWC(), randomWC()]
    })),
    inning: 1,
    half: 0,
    outs: 0,
    bases: [false, false, false],
    score: [0, 0],
    inningScores: [[], []],
    batterIdx: [0, 0],
    phase: 'offense',
    lastResult: null,
    lastResultIdx: -1,
    outsBeforePlay: 0,
    diceVals: [null, null],
    diceOp: null,
    diceResult: null,
    shiftDone: false,
    lastWCWasSteal: false,
    gameOver: false,
    spinDone: false,
    diceDone: false
  };
}

function randomWC() {
  return Math.floor(Math.random() * WILD_CARD_DEFS.length);
}

function battingTeam(gs) { return gs.half; }
function fieldingTeam(gs) { return 1 - gs.half; }

function currentBatter(gs) {
  const bt = battingTeam(gs);
  const t = gs.teams[bt];
  return t.lineup[gs.batterIdx[bt] % t.lineup.length];
}

function currentPitcher(gs) {
  const ft = fieldingTeam(gs);
  const t = gs.teams[ft];
  return t.pitchers[t.activePitcher];
}

function spinWheel(gs) {
  if (gs.spinDone) return null;
  const bi = currentBatter(gs);
  const b = BATTERS[bi];
  const total = b.deg.reduce((a, c) => a + c, 0);
  let r = Math.random() * total, cum = 0, chosen = 0;
  for (let i = 0; i < b.deg.length; i++) {
    cum += b.deg[i];
    if (r <= cum) { chosen = i; break; }
  }
  gs.lastResult = OUTCOME_KEYS[chosen];
  gs.lastResultIdx = chosen;
  gs.spinDone = true;
  gs.outsBeforePlay = gs.outs;
  gs.lastWCWasSteal = false;

  // Calculate wheel animation data
  let mid = 0;
  for (let i = 0; i < chosen; i++) mid += b.deg[i];
  mid += b.deg[chosen] / 2;

  return {
    outcome: OUTCOME_KEYS[chosen],
    outcomeIdx: chosen,
    wheelMidDeg: mid,
    batter: b
  };
}

function rollDice(gs, op) {
  if (gs.diceDone) return null;
  gs.diceOp = op;
  const v0 = Math.floor(Math.random() * 9) + 1;
  const v1 = Math.floor(Math.random() * 9) + 1;
  gs.diceVals = [v0, v1];
  gs.diceResult = op === 'mul' ? v0 * v1 : v0 + v1;
  gs.diceDone = true;

  const pi = currentPitcher(gs);
  const p = PITCHERS[pi];
  const nums = op === 'mul' ? p.mul : p.add;
  const matched = nums.includes(gs.diceResult);

  return {
    dice: [v0, v1],
    op,
    result: gs.diceResult,
    matched
  };
}

function shiftOutcome(gs, dir) {
  if (gs.shiftDone) return;
  gs.shiftDone = true;
  if (dir !== 0) {
    let ni = gs.lastResultIdx + dir;
    if (ni < 0) ni = OUTCOME_KEYS.length - 1;
    if (ni >= OUTCOME_KEYS.length) ni = 0;
    gs.lastResult = OUTCOME_KEYS[ni];
    gs.lastResultIdx = ni;
  }
}

function applyResult(gs) {
  const result = gs.lastResult;
  const bt = battingTeam(gs);
  let runsScored = 0;

  if (result === 'HR') {
    runsScored = 1 + (gs.bases[0] ? 1 : 0) + (gs.bases[1] ? 1 : 0) + (gs.bases[2] ? 1 : 0);
    gs.bases = [false, false, false];
  } else if (result === '3B') {
    runsScored = (gs.bases[0] ? 1 : 0) + (gs.bases[1] ? 1 : 0) + (gs.bases[2] ? 1 : 0);
    gs.bases = [false, false, true];
  } else if (result === '2B') {
    runsScored = (gs.bases[1] ? 1 : 0) + (gs.bases[2] ? 1 : 0);
    const r1 = gs.bases[0];
    gs.bases = [false, true, r1];
  } else if (result === '1B') {
    runsScored = gs.bases[2] ? 1 : 0;
    const r2 = gs.bases[1], r1 = gs.bases[0];
    gs.bases = [true, r1, r2];
  } else if (result === 'BB' || result === 'HBP') {
    if (gs.bases[0] && gs.bases[1] && gs.bases[2]) {
      runsScored = 1;
      gs.bases = [true, true, true];
    } else if (gs.bases[0] && gs.bases[1]) {
      gs.bases = [true, true, true];
    } else if (gs.bases[0]) {
      gs.bases = [true, true, gs.bases[2]];
    } else {
      gs.bases = [true, gs.bases[1], gs.bases[2]];
    }
  } else if (result === 'SO') {
    gs.outs++;
  } else if (result === 'FO') {
    if (gs.bases[2] && gs.outs < 2) { runsScored = 1; gs.bases[2] = false; }
    gs.outs++;
  } else if (result === 'GO') {
    if (gs.bases[2] && gs.outs < 2) runsScored++;
    const r2 = gs.bases[1], r1 = gs.bases[0];
    gs.bases[2] = r2; gs.bases[1] = r1; gs.bases[0] = false;
    gs.outs++;
  }

  gs.score[bt] += runsScored;
  gs.batterIdx[bt] = (gs.batterIdx[bt] + 1) % gs.teams[bt].lineup.length;

  if (gs.outs >= 3) {
    endHalfInning(gs);
  } else {
    gs.phase = 'offense';
    gs.spinDone = false;
    gs.lastResult = null;
    gs.lastWCWasSteal = false;
    gs.diceDone = false;
    gs.diceVals = [null, null];
    gs.diceOp = null;
    gs.diceResult = null;
    gs.shiftDone = false;
  }

  return { runsScored };
}

function endHalfInning(gs) {
  const bt = battingTeam(gs);
  const prevRuns = gs.inningScores[bt].reduce((a, c) => a + c, 0);
  gs.inningScores[bt][gs.inning - 1] = gs.score[bt] - prevRuns;

  // Walk-off check
  if (gs.half === 1 && gs.inning >= 9 && gs.score[1] > gs.score[0]) {
    gs.gameOver = true;
    return;
  }

  if (gs.half === 0) {
    gs.half = 1;
  } else {
    const prevAway = gs.inningScores[0].reduce((a, c) => a + c, 0);
    if (gs.inningScores[0][gs.inning - 1] === undefined) gs.inningScores[0][gs.inning - 1] = 0;
    if (gs.inning >= 9 && gs.score[0] !== gs.score[1]) { gs.gameOver = true; return; }
    if (gs.inning >= 11) { gs.gameOver = true; return; }
    gs.inning++;
    gs.half = 0;
    gs.teams.forEach(t => t.wc.push(randomWC()));
  }

  gs.outs = 0;
  gs.bases = [false, false, false];
  gs.phase = 'offense';
  gs.spinDone = false;
  gs.lastResult = null;
  gs.lastWCWasSteal = false;
  gs.diceDone = false;
  gs.diceVals = [null, null];
  gs.diceOp = null;
  gs.diceResult = null;
  gs.shiftDone = false;
}

function playWildCard(gs, teamIdx, cardIdx, timing) {
  const wi = gs.teams[teamIdx].wc[cardIdx];
  if (wi === undefined) return { valid: false, reason: 'No card at index' };
  const wc = WILD_CARD_DEFS[wi];
  if (!wc.canPlay(gs, timing)) return { valid: false, reason: 'Card cannot be played now' };

  // Verify correct team timing
  const isMyTiming = (wc.type === 'bat' && teamIdx === battingTeam(gs)) ||
                     (wc.type === 'pitch' && teamIdx === fieldingTeam(gs));
  if (!isMyTiming) return { valid: false, reason: 'Not your timing' };

  gs.teams[teamIdx].wc.splice(cardIdx, 1);
  applyWCEffect(gs, wc);

  return { valid: true, card: wc };
}

function applyWCEffect(gs, wc) {
  const bt = battingTeam(gs);
  switch (wc.name) {
    case 'Stolen Base': case 'Wild Pitch': case 'Pitcher Balk':
      if (gs.bases[1]) { gs.bases[2] = true; gs.bases[1] = false; if (gs.bases[0]) { gs.bases[1] = true; gs.bases[0] = false; } }
      else if (gs.bases[0]) { gs.bases[1] = true; gs.bases[0] = false; }
      gs.lastWCWasSteal = wc.name === 'Stolen Base';
      break;
    case 'Double Steal':
      if (gs.bases[2]) gs.score[bt]++;
      gs.bases[2] = gs.bases[1]; gs.bases[1] = gs.bases[0]; gs.bases[0] = false;
      break;
    case 'Stealing Home':
      if (gs.bases[2]) { gs.score[bt]++; gs.bases[2] = false; }
      break;
    case 'Safe on Error':
      if (gs.outs > gs.outsBeforePlay) gs.outs--;
      if (gs.bases[2]) gs.score[bt]++;
      gs.bases[2] = gs.bases[1]; gs.bases[1] = gs.bases[0]; gs.bases[0] = true;
      break;
    case 'Sacrifice Bunt':
      gs.outs++;
      if (gs.bases[2]) gs.score[bt]++;
      gs.bases[2] = gs.bases[1]; gs.bases[1] = gs.bases[0]; gs.bases[0] = false;
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case 'Suicide Squeeze':
      gs.outs++;
      if (gs.bases[2]) { gs.score[bt]++; gs.bases[2] = false; }
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case "Catcher's Interference": case 'Intentional Walk':
      if (gs.bases[0] && gs.bases[1] && gs.bases[2]) gs.score[bt]++;
      else if (gs.bases[0] && gs.bases[1]) gs.bases[2] = true;
      else if (gs.bases[0]) gs.bases[1] = true;
      gs.bases[0] = true;
      break;
    case 'Passed Ball':
      if (gs.outs > gs.outsBeforePlay) gs.outs--;
      gs.bases[0] = true;
      break;
    case 'Double Play':
      gs.outs += 1; gs.bases[0] = false;
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case 'Force Out':
      if (gs.bases[2]) { gs.bases[2] = false; gs.outs++; }
      else if (gs.bases[1]) { gs.bases[1] = false; gs.outs++; }
      else if (gs.bases[0]) { gs.bases[0] = false; gs.outs++; }
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case 'Triple Play':
      gs.outs = 3; gs.bases = [false, false, false];
      endHalfInning(gs);
      break;
    case 'Caught Stealing':
      if (gs.bases[1] && !gs.bases[0]) { gs.bases[1] = false; gs.outs++; }
      else if (gs.bases[2]) { gs.bases[2] = false; gs.outs++; }
      gs.lastWCWasSteal = false;
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case 'Outfield Assist':
      if (gs.bases[2]) { gs.bases[2] = false; gs.outs++; }
      if (gs.outs >= 3) endHalfInning(gs);
      break;
    case 'Pitcher Pick-Off':
      if (gs.bases[1]) { gs.bases[1] = false; gs.outs++; }
      else if (gs.bases[0]) { gs.bases[0] = false; gs.outs++; }
      if (gs.outs >= 3) endHalfInning(gs);
      break;
  }
}

function checkGameEnd(gs) {
  return gs.gameOver;
}

function switchToDefense(gs) {
  gs.phase = 'defense';
  gs.diceDone = false;
  gs.diceVals = [null, null];
  gs.diceOp = null;
  gs.diceResult = null;
  gs.shiftDone = false;
}

module.exports = {
  initGameState, spinWheel, rollDice, shiftOutcome,
  applyResult, playWildCard, checkGameEnd, switchToDefense,
  battingTeam, fieldingTeam, currentBatter, currentPitcher
};
