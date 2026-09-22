import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GitProvider } from './context/GitContext';

// Import custom CSS design system (NO Tailwind)
import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/graph.css';
import './styles/terminal.css';
import './styles/quiz.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GitProvider>
      <App />
    </GitProvider>
  </React.StrictMode>
);
