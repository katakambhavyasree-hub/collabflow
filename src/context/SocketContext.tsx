
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext.tsx';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinProject: (projectId: number) => void;
  leaveProject: (projectId: number) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

export function SocketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      import.meta.env.VITE_API_URL;

    if (!socketUrl) {
      console.error('Socket.IO URL is missing.');
      return;
    }

    const socketInstance: Socket = io(socketUrl, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Socket.IO connected:', socketInstance.id);
      setConnected(true);

      if (user?.id) {
        socketInstance.emit('join-user', user.id);
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      setConnected(false);
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketInstance.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (socket && user?.id && connected) {
      socket.emit('join-user', user.id);
    }
  }, [socket, user?.id, connected]);

  const joinProject = (projectId: number) => {
    if (socket?.connected) {
      socket.emit('join-project', projectId);
    }
  };

  const leaveProject = (projectId: number) => {
    if (socket?.connected) {
      socket.emit('leave-project', projectId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        joinProject,
        leaveProject,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error(
      'useSocket must be used within a SocketProvider'
    );
  }

  return context;
}
