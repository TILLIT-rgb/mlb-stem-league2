const { getRoom } = require('../rooms/roomManager');
const { validateLineup, validatePitcherChoice } = require('../game/lineupEngine');
const { initGameState } = require('../game/gameEngine');

module.exports = function(io, socket) {
  socket.on('updateLineup', ({ roomCode, lineup }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const slot = socket.playerSlot;
    const team = room.gameState.teams[slot];
    const validation = validateLineup(lineup, team.batters);
    if (!validation.valid) {
      return socket.emit('lineupError', { reason: validation.reason });
    }

    team.lineup = lineup;
    io.to(roomCode).emit('lineupUpdated', {
      slot,
      lineup
    });
  });

  socket.on('setPitcher', ({ roomCode, pitcherIdx }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const slot = socket.playerSlot;
    const team = room.gameState.teams[slot];
    const validation = validatePitcherChoice(pitcherIdx, team.pitchers);
    if (!validation.valid) {
      return socket.emit('lineupError', { reason: validation.reason });
    }

    team.activePitcher = pitcherIdx;
    io.to(roomCode).emit('pitcherUpdated', { slot, pitcherIdx });
  });

  socket.on('ready', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) player.ready = true;

    io.to(roomCode).emit('playerReady', { slot: socket.playerSlot });

    // Check if both ready
    if (room.players.length === 2 && room.players.every(p => p.ready)) {
      room.phase = 'game';

      // Initialize lineups if not set
      room.gameState.teams.forEach(t => {
        if (t.lineup.length === 0) t.lineup = [...t.batters];
      });

      room.gameState = initGameState(room.gameState.teams);
      io.to(roomCode).emit('gameStart', { gameState: room.gameState });
    }
  });
};
