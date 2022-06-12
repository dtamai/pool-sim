import React from 'react'
import ReactDOM from 'react-dom/client'
import { IoProvider } from 'socket.io-react-hook'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <IoProvider>
      <App />
    </IoProvider>
  </React.StrictMode>
)
