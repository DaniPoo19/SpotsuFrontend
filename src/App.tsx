import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/700.css';
import { AuthProvider } from './contexts/AuthContext';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;