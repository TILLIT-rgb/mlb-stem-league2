const { BATTERS } = require('../data/batters');

function getDerbyHRChance(batterIdx) {
  const b = BATTERS[batterIdx];
  let chance = 0.25 + (b.slg - 0.350) * 0.8;
  return Math.max(0.20, Math.min(0.55, chance));
}

function getDerbyDeg(batterIdx) {
  const hrChance = getDerbyHRChance(batterIdx);
  const hrDeg = Math.round(hrChance * 360);
  return [hrDeg, 360 - hrDeg];
}

function generateHRDistance(batterIdx) {
  const b = BATTERS[batterIdx];
  const base = 390 + (b.slg - 0.300) * 100;
  const variance = Math.floor(Math.random() * 60) - 10;
  return Math.round(base + variance);
}

function initDerbyState(teams, participantsPerTeam) {
  return {
    teams: teams.map(t => ({
      name: t.name,
      batters: t.batters
    })),
    participantsPerTeam,
    currentTeam: 0,
    currentBatterOrder: 0,
    swingCount: 0,
    maxSwings: 20,
    bonusMode: false,
    results: [
      { totalHR: 0, totalDistance: 0, batters: [] },
      { totalHR: 0, totalDistance: 0, batters: [] }
    ],
    currentHRs: 0,
    currentDistances: [],
    lastSwingResult: null,
    derbyOver: false,
    swingDone: false
  };
}

function derbySwing(ds) {
  if (ds.swingDone || ds.derbyOver) return null;

  const team = ds.currentTeam;
  const batterIdx = ds.teams[team].batters[ds.currentBatterOrder];
  const hrChance = getDerbyHRChance(batterIdx);

  const isHR = Math.random() < hrChance;
  let distance = 0;

  if (isHR) {
    distance = generateHRDistance(batterIdx);
    ds.currentHRs++;
    ds.currentDistances.push(distance);
  }

  ds.swingCount++;
  ds.lastSwingResult = isHR ? 'HR' : 'MISS';
  ds.swingDone = true;

  let turnOver = false;
  if (ds.bonusMode && !isHR) {
    turnOver = true;
  } else if (ds.swingCount >= ds.maxSwings && !ds.bonusMode) {
    if (isHR) {
      ds.bonusMode = true;
    } else {
      turnOver = true;
    }
  }

  return {
    isHR,
    distance,
    swingNumber: ds.swingCount,
    bonusMode: ds.bonusMode,
    turnOver,
    batterIdx,
    hrDeg: getDerbyDeg(batterIdx),
    hrChance
  };
}

function advanceBatter(ds) {
  const team = ds.currentTeam;
  const batterIdx = ds.teams[team].batters[ds.currentBatterOrder];

  ds.results[team].batters.push({
    batterIdx,
    hrs: ds.currentHRs,
    distances: [...ds.currentDistances],
    maxDistance: ds.currentDistances.length > 0 ? Math.max(...ds.currentDistances) : 0,
    totalDistance: ds.currentDistances.reduce((a, b) => a + b, 0)
  });
  ds.results[team].totalHR += ds.currentHRs;
  ds.results[team].totalDistance += ds.currentDistances.reduce((a, b) => a + b, 0);

  ds.currentHRs = 0;
  ds.currentDistances = [];
  ds.swingCount = 0;
  ds.bonusMode = false;
  ds.lastSwingResult = null;
  ds.swingDone = false;

  if (ds.currentTeam === 0) {
    ds.currentTeam = 1;
  } else {
    ds.currentTeam = 0;
    ds.currentBatterOrder++;
    if (ds.currentBatterOrder >= ds.participantsPerTeam) {
      ds.derbyOver = true;
    }
  }
}

function getDerbyWinner(ds) {
  if (ds.results[0].totalHR > ds.results[1].totalHR) return 0;
  if (ds.results[1].totalHR > ds.results[0].totalHR) return 1;
  if (ds.results[0].totalDistance > ds.results[1].totalDistance) return 0;
  if (ds.results[1].totalDistance > ds.results[0].totalDistance) return 1;
  return -1;
}

function resetSwing(ds) {
  ds.swingDone = false;
}

module.exports = {
  initDerbyState, derbySwing, advanceBatter, getDerbyWinner,
  getDerbyHRChance, getDerbyDeg, resetSwing, generateHRDistance
};
