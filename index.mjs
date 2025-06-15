// socket-server/index.mjs
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Store user socket mappings (email -> socketId)
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle user joining with their email
  socket.on('join-room', (userEmail) => {
    if (!userEmail) {
      console.log('Warning: User tried to join without an email');
      return;
    }
    
    console.log(`User ${userEmail} joined with socket ${socket.id}`);
    userSockets.set(userEmail, socket.id);
    
    // Log all connected users
    console.log('Connected users:', Array.from(userSockets.keys()));
  });

  // Handle sending messages
  socket.on('send-message', (msg) => {
    console.log('Message received:', msg);
    
    // Broadcast to recipient if online
    const recipientSocketId = userSockets.get(msg.to);
    if (recipientSocketId) {
      console.log(`Sending to ${msg.to} (socket: ${recipientSocketId})`);
      io.to(recipientSocketId).emit('receive-message', msg);
    } else {
      console.log(`Recipient ${msg.to} is not online`);
    }
    
    // Always echo back to sender
    socket.emit('receive-message', msg);
  });

  socket.on('disconnect', () => {
    // Find and remove the user from our mapping
    for (const [userEmail, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        console.log(`User ${userEmail} disconnected`);
        userSockets.delete(userEmail);
        break;
      }
    }
  });
});

server.listen(3001, () => {
  console.log('Socket server running on http://localhost:3001');
});