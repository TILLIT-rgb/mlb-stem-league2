const { getRoom } = require('../rooms/roomManager');
const engine = require('../game/gameEngine');

module.exports = function(io, socket) {
  socket.on('spinWheel', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    const gs = room.gameState;
    // Only batting team can spin
    if (socket.playerSlot !== engine.battingTeam(gs)) {
      return socket.emit('actionError', { reason: 'Not your turn to spin' });
    }

    const result = engine.spinWheel(gs);
    if (!result) return socket.emit('actionError', { reason: 'Already spun' });

    io.to(roomCode).emit('spinResult', {
      ...result,
      gameState: gs
    });
  });

  socket.on('rollDice', ({ roomCode, operation }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    const gs = room.gameState;
    if (socket.playerSlot !== engine.fieldingTeam(gs)) {
      return socket.emit('actionError', { reason: 'Not your turn to roll' });
    }

    const result = engine.rollDice(gs, operation);
    if (!result) return socket.emit('actionError', { reason: 'Already rolled' });

    io.to(roomCode).emit('diceResult', {
      ...result,
      gameState: gs
    });
  });

  socket.on('shiftOutcome', ({ roomCode, direction }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    const gs = room.gameState;
    if (socket.playerSlot !== engine.fieldingTeam(gs)) {
      return socket.emit('actionError', { reason: 'Not your turn to shift' });
    }

    engine.shiftOutcome(gs, direction);
    io.to(roomCode).emit('outcomeShifted', { gameState: gs });
  });

  socket.on('toDefense', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    engine.switchToDefense(room.gameState);
    io.to(roomCode).emit('gameStateUpdated', { gameState: room.gameState });
  });

  socket.on('applyResult', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    const result = engine.applyResult(room.gameState);
    const gameOver = engine.checkGameEnd(room.gameState);

    io.to(roomCode).emit('resultApplied', {
      runsScored: result.runsScored,
      gameState: room.gameState,
      gameOver
    });

    if (gameOver) {
      io.to(roomCode).emit('gameOver', {
        gameState: room.gameState,
        winner: room.gameState.score[0] > room.gameState.score[1] ? 0 : 1
      });
    }
  });

  socket.on('playWildCard', ({ roomCode, cardIdx, timing }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'game') return;

    const gs = room.gameState;
    const result = engine.playWildCard(gs, socket.playerSlot, cardIdx, timing);
    if (!result.valid) {
      return socket.emit('actionError', { reason: result.reason });
    }

    io.to(roomCode).emit('wildCardPlayed', {
      card: result.card,
      teamIdx: socket.playerSlot,
      gameState: gs,
      gameOver: engine.checkGameEnd(gs)
    });
  });
};
