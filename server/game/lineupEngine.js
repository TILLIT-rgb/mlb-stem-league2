const { BATTERS } = require('../data/batters');

function validateLineup(lineup, batters) {
  if (!Array.isArray(lineup)) return { valid: false, reason: 'Lineup must be an array' };
  if (lineup.length !== batters.length) return { valid: false, reason: 'Lineup must include all batters' };
  const sorted1 = [...lineup].sort();
  const sorted2 = [...batters].sort();
  for (let i = 0; i < sorted1.length; i++) {
    if (sorted1[i] !== sorted2[i]) return { valid: false, reason: 'Lineup must contain exactly the drafted batters' };
  }
  return { valid: true };
}

function validatePitcherChoice(pitcherIdx, pitchers) {
  if (pitcherIdx < 0 || pitcherIdx >= pitchers.length) return { valid: false, reason: 'Invalid pitcher index' };
  return { valid: true };
}

module.exports = { validateLineup, validatePitcherChoice };
