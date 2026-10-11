import { Server, Socket } from 'socket.io';

export function setupSocketHandler(io: Server): void {
  io.on('connection', (socket: Socket) => {
    // Join project room
    socket.on('join-project', (projectId: string | number) => {
      const room = `project_${projectId}`;
      socket.join(room);
    });

    socket.on('leave-project', (projectId: string | number) => {
      const room = `project_${projectId}`;
      socket.leave(room);
    });

    // Join user notification channel
    socket.on('join-user', (userId: string | number) => {
      const room = `user_${userId}`;
      socket.join(room);
    });

    // Client-to-client real-time sync relays
    socket.on('task-move-client', (data: { projectId: number; taskId: number; newStatus: string; position: number }) => {
      if (data && data.projectId) {
        socket.to(`project_${data.projectId}`).emit('task-moved', data);
        socket.to(`project_${data.projectId}`).emit('task:moved', data);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}
