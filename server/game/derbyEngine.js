const { BATTERS } = require('../data/batters');

const OUTS_PER_BATTER = 10;

function initDerbyState(teams, target) {
  return {
    currentTeam: 0,
    batterOrder: [
      teams[0].batters.slice(0, target),
      teams[1].batters.slice(0, target)
    ],
    currentBatterIdx: [0, 0],
    outs: 0,
    hrs: [[],[]],
    teamTotals: [0, 0],
    swingResult: null,
    derbyOver: false,
    teamNames: [teams[0].name, teams[1].name]
  };
}

function derbySwing(ds) {
  if (ds.derbyOver) return null;

  const ct = ds.currentTeam;
  const bi = ds.batterOrder[ct][ds.currentBatterIdx[ct]];
  const b = BATTERS[bi];

  const total = b.deg.reduce((a, c) => a + c, 0);
  let r = Math.random() * total, cum = 0, chosen = 0;
  for (let i = 0; i < b.deg.length; i++) {
    cum += b.deg[i];
    if (r <= cum) { chosen = i; break; }
  }

  // In HR derby: index 3 = HR, everything else = out
  const isHR = chosen === 3;

  if (isHR) {
    ds.teamTotals[ct]++;
    if (!ds.hrs[ct][ds.currentBatterIdx[ct]]) ds.hrs[ct][ds.currentBatterIdx[ct]] = 0;
    ds.hrs[ct][ds.currentBatterIdx[ct]]++;
  } else {
    ds.outs++;
  }

  const turnOver = ds.outs >= OUTS_PER_BATTER;

  return {
    isHR,
    outcomeIdx: chosen,
    batter: b,
    outs: ds.outs,
    teamTotals: ds.teamTotals.slice(),
    turnOver
  };
}

function advanceBatter(ds) {
  const ct = ds.currentTeam;
  ds.currentBatterIdx[ct]++;
  ds.outs = 0;

  if (ds.currentBatterIdx[ct] >= ds.batterOrder[ct].length) {
    if (ct === 0) {
      ds.currentTeam = 1;
      ds.currentBatterIdx[1] = 0;
    } else {
      ds.derbyOver = true;
    }
  }
}

function getDerbyWinner(ds) {
  if (ds.teamTotals[0] > ds.teamTotals[1]) return 0;
  if (ds.teamTotals[1] > ds.teamTotals[0]) return 1;
  return -1; // tie
}

function resetSwing(ds) {
  ds.swingResult = null;
}

module.exports = { initDerbyState, derbySwing, advanceBatter, getDerbyWinner, resetSwing };
