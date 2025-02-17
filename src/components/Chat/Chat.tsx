'use client';
import React, { useEffect } from 'react';

const Chat: React.FC = () => {
  useEffect(() => {
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => {
      console.log('WebSocket connection established!');
      socket.send('Hello from the client!');
    };

    socket.onmessage = (event) => {
      console.log('Message from server:', event.data);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up when component unmounts
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>WebSocket Test</h1>
    </div>
  );
};

export default Chat;
