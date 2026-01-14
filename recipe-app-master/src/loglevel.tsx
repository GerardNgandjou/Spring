import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import log from 'loglevel';

// Configure logging
log.setLevel('debug'); // Enable all logs

// You can also test a log
log.info("App is starting...");

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
