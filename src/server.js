const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const Game = require('./game.js');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '..', 'public')));

const rooms = {};

/**
 * Generates a unique 5-character room code.
 */
function generateRoomCode() {
    let code;
    do {
        code = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (rooms[code]);
    return code;
}

function broadcastGameState(roomCode) {
    const room = rooms[roomCode];
    if (room && room.game) {
        io.to(roomCode).emit('gameStateUpdate', room.game.getState());
    }
}

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    let currentRoomCode = null;

    // --- Room Creation ---
    socket.on('createGame', () => {
        const roomCode = generateRoomCode();
        currentRoomCode = roomCode;
        rooms[roomCode] = {
            id: roomCode,
            players: {},
            hostId: socket.id,
            game: null
        };

        const player = { id: socket.id, color: 'red' };
        rooms[roomCode].players[socket.id] = player;

        socket.join(roomCode);
        socket.emit('gameCreated', { roomCode, player, hostId: rooms[roomCode].hostId });
        io.to(roomCode).emit('playerListUpdate', Object.values(rooms[roomCode].players));
    });

    // --- Room Joining ---
    socket.on('joinGame', (roomCode) => {
        const upperCaseRoomCode = roomCode.toUpperCase();
        const room = rooms[upperCaseRoomCode];

        if (!room) return socket.emit('lobbyError', 'Room not found.');
        if (Object.keys(room.players).length >= 4) return socket.emit('lobbyError', 'Room is full.');
        if (room.game) return socket.emit('lobbyError', 'Game has already started.');

        const assignedColors = Object.values(room.players).map(p => p.color);
        const colorOrder = ['red', 'yellow', 'green', 'blue'];
        const color = colorOrder.find(c => !assignedColors.includes(c));

        const player = { id: socket.id, color };
        room.players[socket.id] = player;
        currentRoomCode = upperCaseRoomCode;

        socket.join(upperCaseRoomCode);
        socket.emit('gameJoined', { roomCode: upperCaseRoomCode, player, hostId: room.hostId });
        io.to(upperCaseRoomCode).emit('playerListUpdate', Object.values(room.players));
    });

    // --- Game Actions ---
    socket.on('startGame', () => {
        const room = rooms[currentRoomCode];
        if (room && room.hostId === socket.id) {
            if (Object.keys(room.players).length >= 2) {
                const gamePlayers = Object.values(room.players);
                // Pass a callback to the game instance for it to trigger broadcasts
                room.game = new Game(gamePlayers, () => {
                    broadcastGameState(currentRoomCode);
                });
                io.to(currentRoomCode).emit('gameStarted', { players: gamePlayers });
            } else {
                socket.emit('lobbyError', 'Not enough players to start.');
            }
        }
    });

    socket.on('rollDice', () => {
        const room = rooms[currentRoomCode];
        if (room && room.game) {
            room.game.rollDice(socket.id);
        }
    });

    socket.on('moveToken', (data) => {
        const room = rooms[currentRoomCode];
        if (room && room.game) {
            room.game.moveToken(socket.id, data.color, data.tokenId);
        }
    });

    socket.on('turnTimeout', () => {
        const room = rooms[currentRoomCode];
        if (room && room.game) {
            // Handle turn timeout by automatically ending the turn
            room.game.handleTurnTimeout(socket.id);
            broadcastGameState(currentRoomCode);
        }
    });

    socket.on('sendMessage', (message) => {
        const room = rooms[currentRoomCode];
        if (room && room.players[socket.id]) {
            const player = room.players[socket.id];
            io.to(currentRoomCode).emit('newMessage', {
                senderColor: player.color,
                message: message
            });
        }
    });

    // --- Host and Disconnection ---
    socket.on('kickPlayer', (playerIdToKick) => {
        // (Logic is the same, but simplified for brevity)
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        if (currentRoomCode && rooms[currentRoomCode]) {
            const room = rooms[currentRoomCode];
            if (!room.players[socket.id]) return;

            const disconnectedPlayerColor = room.players[socket.id].color;
            delete room.players[socket.id];

            if (Object.keys(room.players).length === 0) {
                delete rooms[currentRoomCode];
                return;
            }

            if (room.game) {
                room.game.removePlayer(disconnectedPlayerColor);
                broadcastGameState(currentRoomCode);
            }

            if (room.hostId === socket.id) {
                room.hostId = Object.keys(room.players)[0];
                io.to(currentRoomCode).emit('hostUpdate', room.hostId);
            }

            io.to(currentRoomCode).emit('playerListUpdate', Object.values(room.players));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
