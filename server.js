import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

// Serve frontend build if it exists
app.use(express.static(path.join(__dirname, 'dist')));

// For any other GET request, send the index.html so React Router (if any) handles it
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Multiplayer State
const rooms = new Map(); // roomId -> { password, gameState, hostId, players: Set() }

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('createRoom', ({ roomId, password, gameState }, callback) => {
        if (rooms.has(roomId)) {
            return callback({ success: false, message: 'Room already exists' });
        }
        rooms.set(roomId, {
            password,
            gameState,
            hostId: socket.id,
            players: new Set([socket.id])
        });
        socket.join(roomId);
        callback({ success: true });
        console.log(`Room created: ${roomId} by ${socket.id}`);
    });

    socket.on('joinRoom', ({ roomId, password }, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            return callback({ success: false, message: 'Room not found' });
        }
        if (room.password && room.password !== password) {
            return callback({ success: false, message: 'Invalid password' });
        }
        room.players.add(socket.id);
        socket.join(roomId);
        // Send current game state to the joining player
        callback({ success: true, gameState: room.gameState });
        console.log(`Client ${socket.id} joined room: ${roomId}`);
    });

    // Host sends updated state to broadcast
    socket.on('syncState', ({ roomId, gameState }) => {
        const room = rooms.get(roomId);
        if (room && room.hostId === socket.id) {
            room.gameState = gameState;
            // Broadcast to everyone else in the room
            socket.to(roomId).emit('stateUpdated', gameState);
        }
    });

    // Client sends an action directly (if we choose to implement it this way)
    // But since Main.js has host logic, the client can just pass actions to the host.
    socket.on('clientAction', ({ roomId, action }) => {
        const room = rooms.get(roomId);
        if (room) {
            // Send action only to the host
            io.to(room.hostId).emit('clientActionReceived', action);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Clean up rooms if host disconnects or player leaves
        rooms.forEach((room, roomId) => {
            if (room.players.has(socket.id)) {
                room.players.delete(socket.id);
                if (room.hostId === socket.id) {
                    // Host left, close room
                    io.to(roomId).emit('roomClosed');
                    rooms.delete(roomId);
                    console.log(`Room closed (host left): ${roomId}`);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
