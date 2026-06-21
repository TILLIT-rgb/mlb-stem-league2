function showSetupScreen() {
  showScreen('setup');
}

function createRoom() {
  const teamName = document.getElementById('t1name').value || 'Team 1';
  socket.emit('createRoom', { teamName });
}

function joinRoom() {
  const code = document.getElementById('roomCodeInput').value.toUpperCase().trim();
  const teamName = document.getElementById('t1name').value || 'Team 2';
  if (code.length !== 4) return alert('Enter a 4-character room code');
  socket.emit('joinRoom', { roomCode: code, teamName });
}

function showWaitingRoom(roomCode) {
  document.getElementById('waitingCode').textContent = roomCode;
  showScreen('waiting');
}
