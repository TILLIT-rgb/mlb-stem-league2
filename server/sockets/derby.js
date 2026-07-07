const { getRoom } = require('../rooms/roomManager');
const derby = require('../game/derbyEngine');
const { BATTERS } = require('../data/batters');

module.exports = function(io, socket) {
  socket.on('setDerbyParticipants', ({ roomCode, count }) => {
    const room = getRoom(roomCode);
    if (!room || room.mode !== 'derby') return;
    if (socket.playerSlot !== 0) return;

    room.derbyParticipants = Math.max(1, Math.min(5, count));
    io.to(roomCode).emit('derbyParticipantsSet', { count: room.derbyParticipants });
  });

  socket.on('startDerbyDraft', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.mode !== 'derby' || !room.derbyParticipants) return;
    if (socket.playerSlot !== 0) return;

    room.phase = 'derbyDraft';
    room.derbyDraftState = {
      currentTeam: 0,
      teams: [[], []],
      picked: new Set(),
      target: room.derbyParticipants
    };

    io.to(roomCode).emit('derbyDraftStart', {
      teams: [[], []],
      picked: [],
      currentTeam: 0,
      target: room.derbyParticipants,
      teamNames: room.gameState.teams.map(t => t.name)
    });
  });

  socket.on('derbyDraftPick', ({ roomCode, batterIdx }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'derbyDraft') return;

    const ds = room.derbyDraftState;
    if (socket.playerSlot !== ds.currentTeam) {
      return socket.emit('actionError', { reason: 'Not your turn' });
    }

    if (batterIdx < 0 || batterIdx >= BATTERS.length) return;
    if (ds.picked.has(batterIdx)) {
      return socket.emit('actionError', { reason: 'Already picked' });
    }

    ds.picked.add(batterIdx);
    ds.teams[ds.currentTeam].push(batterIdx);
    ds.currentTeam = 1 - ds.currentTeam;

    const complete = ds.teams[0].length >= ds.target && ds.teams[1].length >= ds.target;

    io.to(roomCode).emit('derbyDraftUpdated', {
      teams: ds.teams,
      picked: Array.from(ds.picked),
      currentTeam: ds.currentTeam,
      target: ds.target,
      complete,
      teamNames: room.gameState.teams.map(t => t.name)
    });

    if (complete) {
      room.phase = 'derby';
      room.gameState.teams[0].batters = ds.teams[0];
      room.gameState.teams[1].batters = ds.teams[1];
      room.derbyState = derby.initDerbyState(room.gameState.teams, ds.target);

      setTimeout(() => {
        io.to(roomCode).emit('derbyStart', { derbyState: room.derbyState });
      }, 1000);
    }
  });

  socket.on('derbySwing', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'derby') return;

    const ds = room.derbyState;
    if (socket.playerSlot !== ds.currentTeam) {
      return socket.emit('actionError', { reason: 'Not your turn to swing' });
    }

    const result = derby.derbySwing(ds);
    if (!result) return;

    io.to(roomCode).emit('derbySwingResult', {
      ...result,
      derbyState: ds
    });

    if (result.turnOver) {
      derby.advanceBatter(ds);
      setTimeout(() => {
        if (ds.derbyOver) {
          const winner = derby.getDerbyWinner(ds);
          io.to(roomCode).emit('derbyOver', { derbyState: ds, winner });
        } else {
          io.to(roomCode).emit('derbyNextBatter', { derbyState: ds });
        }
      }, 2000);
    }
  });

  socket.on('derbyNextSwing', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || room.phase !== 'derby') return;

    derby.resetSwing(room.derbyState);
    io.to(roomCode).emit('derbySwingReady', { derbyState: room.derbyState });
  });
};
