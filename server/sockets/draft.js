const { getRoom } = require('../rooms/roomManager');
const { validateDraftPick, applyDraftPick, isDraftComplete, getDraftState } = require('../game/draftEngine');

module.exports = function(io, socket) {
  socket.on('draftPick', ({ roomCode, playerId, type }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'draft') return;

    const validation = validateDraftPick(room.gameState, playerId, type);
    if (!validation.valid) {
      return socket.emit('draftPickError', { reason: validation.reason });
    }

    // Verify it's this player's turn
    const { getDraftTeam } = require('../game/draftEngine');
    const expectedTeam = getDraftTeam(room.gameState.draftTotal);
    if (socket.playerSlot !== expectedTeam) {
      return socket.emit('draftPickError', { reason: 'Not your turn' });
    }

    applyDraftPick(room.gameState, playerId, type);
    const draftState = getDraftState(room.gameState);

    io.to(roomCode).emit('draftUpdated', draftState);

    if (isDraftComplete(room.gameState)) {
      io.to(roomCode).emit('draftComplete', draftState);
    }
  });
};
