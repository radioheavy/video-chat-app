import { NextRequest, NextResponse } from 'next/server';
import { Server } from 'socket.io';

export async function GET(request: NextRequest) {
  // Socket.io sunucusunu başlatma
  const io = new Server({
    path: '/api/socket',
    addTrailingSlash: false
  });

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı');

    // Oda oluşturma
    socket.on('create-room', (roomId) => {
      socket.join(roomId);
      socket.emit('room-created', roomId);
    });

    // Odaya katılma
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-connected', socket.id);
    });

    // WebRTC sinyal paylaşımı
    socket.on('offer', (data) => {
      socket.to(data.roomId).emit('offer', data);
    });

    socket.on('answer', (data) => {
      socket.to(data.roomId).emit('answer', data);
    });

    socket.on('ice-candidate', (data) => {
      socket.to(data.roomId).emit('ice-candidate', data);
    });

    socket.on('disconnect', () => {
      console.log('Kullanıcı bağlantısı kesildi');
    });
  });

  return NextResponse.json({ message: 'Socket.io sunucusu başlatıldı' });
} 