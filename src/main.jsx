import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './lib/AppContext'
import LandingScreen from './pages/LandingScreen'
import LobbyScreen from './pages/LobbyScreen'
import RoleRevealScreen from './pages/RoleRevealScreen'
import VotingScreen from './pages/VotingScreen'
import GameOverScreen from './pages/GameOverScreen'
import './index.css'

function AppContent() {
  const { currentScreen } = useApp()

  const renderScreen = () => {
    switch (currentScreen) {
      case 'LANDING':
        return <LandingScreen />
      case 'LOBBY':
        return <LobbyScreen />
      case 'ROLE_REVEAL':
        return <RoleRevealScreen />
      case 'VOTING':
        return <VotingScreen />
      case 'GAME_OVER':
        return <GameOverScreen />
      default:
        return <LandingScreen />
    }
  }

  return (
    <div className="app">
      {renderScreen()}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
)
