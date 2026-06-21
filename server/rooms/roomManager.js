const Room = require('../models/Room');

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom() {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  const room = new Room(code);
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function removeRoom(code) {
  rooms.delete(code);
}

function findRoomBySocketId(socketId) {
  for (const [code, room] of rooms) {
    const player = room.players.find(p => p.socketId === socketId);
    if (player) return { room, player };
  }
  return null;
}

module.exports = { createRoom, getRoom, removeRoom, findRoomBySocketId };
