import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);

// StrictMode is disabled here intentionally because @hello-pangea/dnd 
// sometimes has flickering issues in React 18 Strict Mode during development.
// In production it is fine, but for a smooth first-run experience, we keep it simple.
root.render(
    <App />
);