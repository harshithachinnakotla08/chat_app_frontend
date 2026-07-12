import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppNavigator />
      </SocketProvider>
    </AuthProvider>
  );
}