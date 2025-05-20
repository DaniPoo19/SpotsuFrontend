import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ParQProvider } from './contexts/ParQContext';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routes/AppRoutes';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <ParQProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
            },
            success: {
              style: {
                background: '#ECFDF5',
                border: '1px solid #10B981',
                color: '#065F46',
              },
            },
            error: {
              style: {
                background: '#FEF2F2',
                border: '1px solid #EF4444',
                color: '#991B1B',
              },
            },
          }}
        />
        <AppRoutes />
      </ParQProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;