import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // 여기서 ./App은 App.js 파일을 가리킵니다.

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
