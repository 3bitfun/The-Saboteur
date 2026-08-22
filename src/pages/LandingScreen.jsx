import { useState } from 'react'
import { useApp } from '../lib/AppContext'
import { generateRoomCode, generateUUID } from '../lib/supabase'
import { Shield, Users, Rocket } from 'lucide-react'

export default function LandingScreen() {
  const { 
    supabaseConfig, 
    setSupabaseConfig, 
    supabaseClient,
    playerName, 
    setPlayerName, 
    roomCode, 
    setRoomCode,
    setCurrentScreen,
    setRoomId,
    setPlayerId,
    setCurrentPlayer,
    setPlayers,
    setGameState
  } = useApp()
  
  const [localUrl, setLocalUrl] = useState(supabaseConfig.url)
  const [localKey, setLocalKey] = useState(supabaseConfig.anonKey)
  const [error, setError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSaveConfig = () => {
    if (!localUrl || !localKey) {
      setError('Please provide both Supabase URL and Anon Key')
      return
    }
    setSupabaseConfig({ url: localUrl, anonKey: localKey })
    setError('')
  }

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name')
      return
    }
    if (!supabaseClient) {
      setError('Please configure Supabase first')
      return
    }

    setIsConnecting(true)
    setError('')

    try {
      const newRoomCode = generateRoomCode()
      const newRoomId = generateUUID()
      const newPlayerId = generateUUID()

      // Create room
      const { error: roomError } = await supabaseClient
        .from('rooms')
        .insert({
          id: newRoomId,
          code: newRoomCode,
          status: 'LOBBY'
        })

      if (roomError) throw roomError

      // Create player as host
      const { error: playerError } = await supabaseClient
        .from('players')
        .insert({
          id: newPlayerId,
          room_id: newRoomId,
          name: playerName.trim(),
          role: 'CREWMATE',
          is_host: true,
          is_alive: true,
          vote_target: null
        })

      if (playerError) throw playerError

      setRoomId(newRoomId)
      setPlayerId(newPlayerId)
      setRoomCode(newRoomCode)
      
      const hostPlayer = {
        id: newPlayerId,
        name: playerName.trim(),
        role: 'CREWMATE',
        is_host: true,
        is_alive: true
      }
      setCurrentPlayer(hostPlayer)
      setPlayers([hostPlayer])
      setCurrentScreen('LOBBY')
    } catch (err) {
      console.error('Error creating room:', err)
      setError('Failed to create room. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter a player name')
      return
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }
    if (!supabaseClient) {
      setError('Please configure Supabase first')
      return
    }

    setIsConnecting(true)
    setError('')

    try {
      // Find room by code
      const { data: room, error: roomError } = await supabaseClient
        .from('rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase().trim())
        .single()

      if (roomError || !room) {
        throw new Error('Room not found')
      }

      if (room.status !== 'LOBBY') {
        throw new Error('Game already in progress')
      }

      const newPlayerId = generateUUID()

      // Create player
      const { error: playerError } = await supabaseClient
        .from('players')
        .insert({
          id: newPlayerId,
          room_id: room.id,
          name: playerName.trim(),
          role: 'CREWMATE',
          is_host: false,
          is_alive: true,
          vote_target: null
        })

      if (playerError) throw playerError

      setRoomId(room.id)
      setPlayerId(newPlayerId)
      
      const newPlayer = {
        id: newPlayerId,
        name: playerName.trim(),
        role: 'CREWMATE',
        is_host: false,
        is_alive: true
      }
      setCurrentPlayer(newPlayer)
      setCurrentScreen('LOBBY')
    } catch (err) {
      console.error('Error joining room:', err)
      setError(err.message || 'Failed to join room')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-neon-cyan neon-text-cyan mb-2 tracking-wider">
            THE IMPOSTOR
          </h1>
          <h2 className="text-3xl font-bold text-neon-purple neon-text-purple mb-4">
            ENGINE
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Shield className="w-5 h-5" />
            <span className="text-sm">SOCIAL DEDUCTION SYSTEM</span>
          </div>
        </div>

        {/* Supabase Config Card */}
        {!supabaseClient && (
          <div className="card-neon rounded-xl p-6 mb-6 scanline relative">
            <h3 className="text-lg font-bold text-neon-cyan mb-4 flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              SUPABASE CONFIGURATION
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">SUPABASE URL</label>
                <input
                  type="text"
                  value={localUrl}
                  onChange={(e) => setLocalUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  className="w-full bg-dark-card border border-neon-cyan/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">SUPABASE ANON KEY</label>
                <input
                  type="password"
                  value={localKey}
                  onChange={(e) => setLocalKey(e.target.value)}
                  placeholder="eyJhbG..."
                  className="w-full bg-dark-card border border-neon-cyan/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <button
                onClick={handleSaveConfig}
                className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-bold py-3 rounded-lg btn-neon"
              >
                CONNECT TO SUPABASE
              </button>
            </div>
          </div>
        )}

        {/* Join/Create Card */}
        <div className="card-neon rounded-xl p-6 scanline relative">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-neon-purple" />
            <h3 className="text-xl font-bold">ENTER THE STATION</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">OPERATOR NAME</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                className="w-full bg-dark-card border border-neon-cyan/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">ROOM CODE (Optional for creating)</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="XXXX"
                maxLength={4}
                className="w-full bg-dark-card border border-neon-purple/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-purple transition-colors uppercase tracking-widest"
              />
            </div>

            {error && (
              <div className="text-neon-red text-sm text-center py-2 bg-neon-red/10 rounded-lg border border-neon-red/30">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={handleCreateRoom}
                disabled={isConnecting}
                className="bg-gradient-to-r from-neon-cyan to-cyan-600 text-dark-bg font-bold py-3 rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'CONNECTING...' : 'CREATE ROOM'}
              </button>
              <button
                onClick={handleJoinRoom}
                disabled={isConnecting}
                className="bg-gradient-to-r from-neon-purple to-purple-600 text-white font-bold py-3 rounded-lg btn-neon disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'CONNECTING...' : 'JOIN ROOM'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          v1.0.0 • RETRO-FUTURISTIC EDITION
        </p>
      </div>
    </div>
  )
}
