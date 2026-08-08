import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'spendpilot_dev_jwt_secret_key_2026_super_secure';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
                    socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication failed. Token missing.'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.userId;

      const user = db.findOne('users', u => u.id === decoded.userId);
      if (!user) {
        return next(new Error('Authentication failed. User not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication failed. Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket Connected: User ${socket.user.name} (${socket.userId})`);

    // Auto-join user to all authorized group rooms
    const userMemberships = db.find('group_members', m => m.user_id === socket.userId);
    userMemberships.forEach(m => {
      const roomName = `group:${m.group_id}`;
      socket.join(roomName);
    });

    // Explicit Join Group Room Request with Authorization Check
    socket.on('join_group', ({ groupId }, callback) => {
      const membership = db.findOne('group_members', m => m.group_id === groupId && m.user_id === socket.userId);
      if (!membership) {
        if (typeof callback === 'function') callback({ success: false, error: 'Unauthorized to join this group room.' });
        return;
      }

      const roomName = `group:${groupId}`;
      socket.join(roomName);
      console.log(`👤 User ${socket.user.name} joined room ${roomName}`);
      if (typeof callback === 'function') callback({ success: true, room: roomName });
    });

    // Explicit Leave Group Room Request
    socket.on('leave_group', ({ groupId }) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: ${socket.user.name}`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Emit a verified real-time event to connected members of a group
 * Only called after successful database commit.
 */
export function emitGroupEvent(groupId, eventType, data, actorId) {
  if (!io) return;

  const eventPayload = {
    eventId: crypto.randomUUID(),
    eventType,
    groupId,
    actorId,
    timestamp: new Date().toISOString(),
    data
  };

  const roomName = `group:${groupId}`;
  
  // Emit specific event and generic real-time event for unified client handling
  io.to(roomName).emit(eventType, eventPayload);
  io.to(roomName).emit('group:realtime-event', eventPayload);

  return eventPayload;
}
