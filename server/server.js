const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { findRoomBySocketId, getRoom } = require('./rooms/roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Serve static client files
app.use(express.static(path.join(__dirname, '..', 'client')));

const lobbyHandler = require('./sockets/lobby');
const draftHandler = require('./sockets/draft');
const lineupHandler = require('./sockets/lineup');
const gameHandler = require('./sockets/game');

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  lobbyHandler(io, socket);
  draftHandler(io, socket);
  lineupHandler(io, socket);
  gameHandler(io, socket);

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const found = findRoomBySocketId(socket.id);
    if (found) {
      const { room } = found;
      socket.to(room.code).emit('playerDisconnected', {
        slot: found.player.slot,
        message: 'Opponent disconnected. Waiting for reconnection...'
      });

      // 5-minute timeout for forfeit
      setTimeout(() => {
        const current = findRoomBySocketId(socket.id);
        // If player hasn't reconnected (socket ID still matches old one)
        if (!current) {
          const r = getRoom(room.code);
          if (r && r.players.find(p => p.socketId === socket.id)) {
            io.to(room.code).emit('forfeit', {
              disconnectedSlot: found.player.slot,
              winner: 1 - found.player.slot
            });
          }
        }
      }, 5 * 60 * 1000);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`MLB STEM League server running on port ${PORT}`);
});
