import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getInitialTheme, applyTheme } from './utils/theme';

// Ensure theme is applied to DOM immediately on bootstrap
applyTheme(getInitialTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
