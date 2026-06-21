const { BATTERS, OUTCOME_KEYS } = require('../data/batters');
const { PITCHERS } = require('../data/pitchers');

const POSITIONS_UNIQUE = ['C', '1B', '2B', '3B', 'SS'];
const DRAFT_BATTERS_REQUIRED = 9;
const DRAFT_PITCHERS_MIN = 1;
const DRAFT_PITCHERS_MAX = 3;

function getDraftTeam(draftTotal) {
  const block = Math.floor(draftTotal / 4);
  const phase = block % 4;
  return (phase === 0 || phase === 3) ? 0 : 1;
}

function getPicksLeftInBlock(draftTotal) {
  return 4 - (draftTotal % 4);
}

function isBatterLocked(teams, teamIdx, bIdx) {
  const b = BATTERS[bIdx];
  const eligPos = b.p.filter(pp => POSITIONS_UNIQUE.includes(pp));
  if (eligPos.length === 0) return false;
  const team = teams[teamIdx];
  for (const pos of eligPos) {
    const count = team.batters.filter(bi => {
      const bp = BATTERS[bi].p;
      if (bp.length === 1 && bp[0] === pos) return true;
      if (bp.includes(pos)) return true;
      return false;
    }).length;
    if (count < 1) return false;
  }
  return true;
}

function validateDraftPick(gameState, playerIdx, type) {
  const team = getDraftTeam(gameState.draftTotal);
  const teams = gameState.teams;

  if (type === 'bat') {
    if (playerIdx < 0 || playerIdx >= BATTERS.length) return { valid: false, reason: 'Invalid player' };
    if (teams[team].batters.length >= DRAFT_BATTERS_REQUIRED) return { valid: false, reason: 'Roster full' };
    // Check already drafted
    if (teams[0].batters.includes(playerIdx) || teams[1].batters.includes(playerIdx)) {
      return { valid: false, reason: 'Already drafted' };
    }
    if (isBatterLocked(teams, team, playerIdx)) return { valid: false, reason: 'Position locked' };
  } else {
    if (playerIdx < 0 || playerIdx >= PITCHERS.length) return { valid: false, reason: 'Invalid pitcher' };
    if (teams[team].pitchers.length >= DRAFT_PITCHERS_MAX) return { valid: false, reason: 'Pitcher roster full' };
    if (teams[0].pitchers.includes(playerIdx) || teams[1].pitchers.includes(playerIdx)) {
      return { valid: false, reason: 'Already drafted' };
    }
  }

  return { valid: true, team };
}

function applyDraftPick(gameState, playerIdx, type) {
  const team = getDraftTeam(gameState.draftTotal);
  if (type === 'bat') {
    gameState.teams[team].batters.push(playerIdx);
  } else {
    gameState.teams[team].pitchers.push(playerIdx);
  }
  gameState.draftTotal++;
  return gameState;
}

function isDraftComplete(gameState) {
  return gameState.teams[0].batters.length >= DRAFT_BATTERS_REQUIRED &&
         gameState.teams[0].pitchers.length >= DRAFT_PITCHERS_MIN &&
         gameState.teams[1].batters.length >= DRAFT_BATTERS_REQUIRED &&
         gameState.teams[1].pitchers.length >= DRAFT_PITCHERS_MIN;
}

function getDraftState(gameState) {
  const team = getDraftTeam(gameState.draftTotal);
  return {
    currentTeam: team,
    picksLeftInBlock: getPicksLeftInBlock(gameState.draftTotal),
    draftTotal: gameState.draftTotal,
    teams: gameState.teams.map(t => ({
      name: t.name,
      batters: t.batters,
      pitchers: t.pitchers
    })),
    isComplete: isDraftComplete(gameState)
  };
}

module.exports = {
  getDraftTeam, getPicksLeftInBlock, validateDraftPick,
  applyDraftPick, isDraftComplete, getDraftState
};
