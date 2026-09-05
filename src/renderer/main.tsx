import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import BuddyOuter from './components/mascot/BuddyOuter'
import BuddyNotch from './components/mascot/BuddyNotch'
import './index.css'
import './theme.css'

const overlay = new URLSearchParams(window.location.search).get('overlay')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {overlay === 'notch' ? <BuddyNotch /> : overlay === 'buddy' ? <BuddyOuter /> : <App />}
  </React.StrictMode>
)
