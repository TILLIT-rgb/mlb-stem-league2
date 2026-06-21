class Room {
  constructor(code) {
    this.code = code;
    this.host = null;
    this.players = [];
    this.phase = 'lobby'; // lobby, draft, lineup, game
    this.gameState = {};
    this.createdAt = Date.now();
  }
}

module.exports = Room;
