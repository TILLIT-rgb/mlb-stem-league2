function showSetupScreen() {
  showScreen('setup');
}

function createRoom() {
  if (!socket || !socket.connected) {
    alert(t('alert_connecting'));
    return;
  }
  const teamName = document.getElementById('t1name').value || t('team1');
  socket.emit('createRoom', { teamName });
}

function createDerbyRoom() {
  if (!socket || !socket.connected) {
    alert(t('alert_connecting'));
    return;
  }
  const teamName = document.getElementById('t1name').value || t('team1');
  socket.emit('createDerbyRoom', { teamName });
}

function joinRoom() {
  if (!socket || !socket.connected) {
    alert(t('alert_connecting'));
    return;
  }
  const code = document.getElementById('roomCodeInput').value.toUpperCase().trim();
  const teamName = document.getElementById('t1name').value || t('team2');
  if (code.length !== 4) return alert(t('alert_code4'));
  socket.emit('joinRoom', { roomCode: code, teamName });
}

function showWaitingRoom(roomCode) {
  document.getElementById('waitingCode').textContent = roomCode;
  showScreen('waiting');
}
