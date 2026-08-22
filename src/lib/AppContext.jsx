import { createContext, useContext, useState, useEffect } from 'react'
import { createSupabaseClient } from './supabase.js'

const AppContext = createContext()

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export function AppProvider({ children }) {
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    const saved = localStorage.getItem('supabaseConfig')
    return saved ? JSON.parse(saved) : { url: '', anonKey: '' }
  })
  
  const [supabaseClient, setSupabaseClient] = useState(null)
  const [currentScreen, setCurrentScreen] = useState('LANDING')
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [roomId, setRoomId] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [players, setPlayers] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(null)
  const [gameState, setGameState] = useState({
    status: 'LOBBY',
    impostorId: null,
    votes: [],
    ejectedPlayer: null,
    winner: null,
    timer: 30,
    tasksCompleted: 0,
    totalTasks: 4,
    sabotageActive: false,
  })
  const [showRoleReveal, setShowRoleReveal] = useState(false)
  const [revealedRole, setRevealedRole] = useState(null)

  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      localStorage.setItem('supabaseConfig', JSON.stringify(supabaseConfig))
      const client = createSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey)
      setSupabaseClient(client)
    }
  }, [supabaseConfig])

  const value = {
    supabaseConfig,
    setSupabaseConfig,
    supabaseClient,
    currentScreen,
    setCurrentScreen,
    playerName,
    setPlayerName,
    roomCode,
    setRoomCode,
    roomId,
    setRoomId,
    playerId,
    setPlayerId,
    players,
    setPlayers,
    currentPlayer,
    setCurrentPlayer,
    gameState,
    setGameState,
    showRoleReveal,
    setShowRoleReveal,
    revealedRole,
    setRevealedRole,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
