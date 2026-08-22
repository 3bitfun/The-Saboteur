import { useEffect, useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Users, Copy, Play, LogOut, Wifi } from 'lucide-react'

export default function LobbyScreen() {
  const {
    supabaseClient,
    roomId,
    roomCode,
    playerId,
    players,
    setPlayers,
    currentPlayer,
    setCurrentScreen,
    setGameState,
    setShowRoleReveal
  } = useApp()

  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState('')

  // Subscribe to player changes in real-time
  useEffect(() => {
    if (!supabaseClient || !roomId) return

    // Initial fetch
    fetchPlayers()

    // Subscribe to changes
    const channel = supabaseClient
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchPlayers()
        }
      )
      .subscribe()

    // Also subscribe to room status changes
    const roomChannel = supabaseClient
      .channel(`room-status:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          const newStatus = payload.new.status
          if (newStatus === 'GAME') {
            setShowRoleReveal(true)
            setCurrentScreen('ROLE_REVEAL')
          } else if (newStatus === 'VOTING') {
            setCurrentScreen('VOTING')
          } else if (newStatus === 'ENDED') {
            setCurrentScreen('GAME_OVER')
          }
        }
      )
      .subscribe()

    return () => {
      supabaseClient.removeChannel(channel)
      supabaseClient.removeChannel(roomChannel)
    }
  }, [supabaseClient, roomId])

  const fetchPlayers = async () => {
    if (!supabaseClient || !roomId) return

    try {
      const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const playerList = data.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        is_host: p.is_host,
        is_alive: p.is_alive
      }))

      setPlayers(playerList)

      // Update current player info
      const current = playerList.find(p => p.id === playerId)
      if (current) {
        // Current player data is already set
      }
    } catch (err) {
      console.error('Error fetching players:', err)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
  }

  const handleStartGame = async () => {
    if (players.length < 3) {
      setError('Need at least 3 players to start')
      return
    }

    setIsStarting(true)
    setError('')

    try {
      // Randomly assign impostor
      const nonHostPlayers = players.filter(p => !p.is_host)
      const randomIndex = Math.floor(Math.random() * nonHostPlayers.length)
      const impostor = nonHostPlayers[randomIndex]

      // Update impostor role
      const { error: impostorError } = await supabaseClient
        .from('players')
        .update({ role: 'IMPOSTOR' })
        .eq('id', impostor.id)

      if (impostorError) throw impostorError

      // Update room status to GAME
      const { error: roomError } = await supabaseClient
        .from('rooms')
        .update({ status: 'GAME' })
        .eq('id', roomId)

      if (roomError) throw roomError

      setGameState(prev => ({
        ...prev,
        status: 'GAME',
        impostorId: impostor.id
      }))

      setShowRoleReveal(true)
      setCurrentScreen('ROLE_REVEAL')
    } catch (err) {
      console.error('Error starting game:', err)
      setError('Failed to start game')
    } finally {
      setIsStarting(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (!supabaseClient || !playerId) return

    try {
      await supabaseClient
        .from('players')
        .delete()
        .eq('id', playerId)

      // If host, delete the room
      if (currentPlayer?.is_host) {
        await supabaseClient
          .from('rooms')
          .delete()
          .eq('id', roomId)
      }
    } catch (err) {
      console.error('Error leaving room:', err)
    }

    setCurrentScreen('LANDING')
  }

  const isHost = currentPlayer?.is_host

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wifi className="w-6 h-6 text-neon-cyan animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold text-neon-cyan neon-text-cyan">STATION LOBBY</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">ROOM:</span>
                <span className="text-xl font-mono tracking-widest text-neon-purple">{roomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-neon-cyan/20 rounded transition-colors"
                  title="Copy room code"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 px-4 py-2 border border-neon-red/50 text-neon-red rounded-lg hover:bg-neon-red/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            LEAVE
          </button>
        </div>

        {/* Players Grid */}
        <div className="card-neon rounded-xl p-6 mb-6 scanline relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-purple" />
              CONNECTED OPERATORS ({players.length})
            </h2>
            {isHost && players.length >= 3 && (
              <button
                onClick={handleStartGame}
                disabled={isStarting}
                className="flex items-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-bold px-6 py-2 rounded-lg btn-neon disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                {isStarting ? 'INITIALIZING...' : 'START MISSION'}
              </button>
            )}
          </div>

          {error && (
            <div className="text-neon-red text-sm mb-4 p-3 bg-neon-red/10 rounded-lg border border-neon-red/30">
              {error}
            </div>
          )}

          {!isHost && (
            <div className="mb-4 p-3 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
              <p className="text-sm text-neon-cyan">
                Waiting for host to start the mission...
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-lg border ${
                  player.id === playerId
                    ? 'bg-neon-cyan/10 border-neon-cyan'
                    : 'bg-dark-card border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    player.id === playerId ? 'bg-neon-cyan' : 'bg-gray-700'
                  }`}>
                    <Users className={`w-6 h-6 ${
                      player.id === playerId ? 'text-dark-bg' : 'text-gray-300'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">{player.name}</p>
                    <div className="flex items-center gap-2">
                      {player.is_host && (
                        <span className="text-xs px-2 py-0.5 bg-neon-purple/20 text-neon-purple rounded">HOST</span>
                      )}
                      {player.id === playerId && (
                        <span className="text-xs px-2 py-0.5 bg-neon-cyan/20 text-neon-cyan rounded">YOU</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {players.length < 3 && (
            <div className="mt-4 p-4 text-center border border-dashed border-gray-600 rounded-lg">
              <p className="text-gray-400 text-sm">
                Waiting for more operators... (Minimum 3 required)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Share room code: <span className="text-neon-cyan font-mono">{roomCode}</span>
              </p>
            </div>
          )}
        </div>

        {/* Game Rules */}
        <div className="card-neon rounded-xl p-6 scanline relative">
          <h3 className="text-lg font-bold text-neon-cyan mb-4">MISSION BRIEFING</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-bold text-neon-purple mb-2">CREWMATES</h4>
              <ul className="space-y-1 text-xs">
                <li>• Complete all tasks before time runs out</li>
                <li>• Identify and vote out the Impostor</li>
                <li>• Call emergency meetings if suspicious</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-neon-red mb-2">IMPOSTOR</h4>
              <ul className="space-y-1 text-xs">
                <li>• Sabotage station systems</li>
                <li>• Eliminate crewmates without being caught</li>
                <li>• Blend in and deceive others</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
