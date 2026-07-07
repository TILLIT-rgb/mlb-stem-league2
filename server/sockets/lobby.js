const { createRoom, getRoom } = require('../rooms/roomManager');
const { getDraftState } = require('../game/draftEngine');

module.exports = function(io, socket) {
  socket.on('createRoom', (data) => {
    const room = createRoom();
    const playerName = (data && data.teamName) || 'Team 1';
    room.host = socket.id;
    room.mode = 'game';
    room.players.push({
      socketId: socket.id,
      slot: 0,
      teamName: playerName,
      ready: false
    });
    room.gameState = {
      teams: [
        { name: playerName, batters: [], pitchers: [], lineup: [], activePitcher: 0, wc: [] },
        { name: '', batters: [], pitchers: [], lineup: [], activePitcher: 0, wc: [] }
      ],
      draftPicks: [],
      draftTotal: 0
    };
    socket.join(room.code);
    socket.roomCode = room.code;
    socket.playerSlot = 0;
    socket.emit('roomCreated', { roomCode: room.code, slot: 0 });
  });

  socket.on('createDerbyRoom', (data) => {
    const room = createRoom();
    const playerName = (data && data.teamName) || 'Team 1';
    room.host = socket.id;
    room.mode = 'derby';
    room.players.push({
      socketId: socket.id,
      slot: 0,
      teamName: playerName,
      ready: false
    });
    room.gameState = {
      teams: [
        { name: playerName, batters: [] },
        { name: '', batters: [] }
      ]
    };
    socket.join(room.code);
    socket.roomCode = room.code;
    socket.playerSlot = 0;
    socket.emit('roomCreated', { roomCode: room.code, slot: 0, mode: 'derby' });
  });

  socket.on('joinRoom', ({ roomCode, teamName }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('joinError', { reason: 'Room not found' });
    if (room.players.length >= 2) return socket.emit('joinError', { reason: 'Room is full' });
    if (room.phase !== 'lobby') return socket.emit('joinError', { reason: 'Game already in progress' });

    const playerName = teamName || 'Team 2';
    room.players.push({
      socketId: socket.id,
      slot: 1,
      teamName: playerName,
      ready: false
    });
    room.gameState.teams[1].name = playerName;

    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerSlot = 1;

    socket.emit('joinedRoom', { roomCode, slot: 1, teams: room.gameState.teams.map(t => t.name), mode: room.mode });
    io.to(roomCode).emit('playerJoined', {
      teams: room.gameState.teams.map(t => t.name),
      playerCount: room.players.length,
      mode: room.mode
    });

    if (room.players.length === 2) {
      if (room.mode === 'derby') {
        io.to(roomCode).emit('derbyConfigStart', {
          teams: room.gameState.teams.map(t => t.name)
        });
      } else {
        room.phase = 'draft';
        io.to(roomCode).emit('startDraft', {
          teams: room.gameState.teams.map(t => t.name)
        });
        io.to(roomCode).emit('draftUpdated', getDraftState(room.gameState));
      }
    }
  });

  socket.on('reconnectPlayer', ({ roomCode, playerSlot }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('reconnectError', { reason: 'Room not found' });

    const player = room.players.find(p => p.slot === playerSlot);
    if (!player) return socket.emit('reconnectError', { reason: 'Player not found' });

    player.socketId = socket.id;
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerSlot = playerSlot;

    socket.emit('reconnected', {
      roomCode,
      slot: playerSlot,
      phase: room.phase,
      gameState: room.gameState,
      mode: room.mode,
      derbyState: room.derbyState || null
    });
    socket.to(roomCode).emit('opponentReconnected');
  });
};
