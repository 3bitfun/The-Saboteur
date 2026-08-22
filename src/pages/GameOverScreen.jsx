import { useApp } from '../lib/AppContext'
import { Trophy, AlertTriangle, Shield, RotateCcw } from 'lucide-react'

export default function GameOverScreen() {
  const {
    supabaseClient,
    roomId,
    currentPlayer,
    gameState,
    setCurrentScreen,
    setGameState,
    setPlayers,
    setRoomId,
    setPlayerId,
    setRoomCode,
    setPlayerName
  } = useApp()

  const isHost = currentPlayer?.is_host
  const winner = gameState.winner
  const isImpostorWin = winner === 'IMPOSTOR'
  const isCrewmateWin = winner === 'CREWMATES'
  const playerWon = (currentPlayer?.role === 'IMPOSTOR' && isImpostorWin) || 
                    (currentPlayer?.role === 'CREWMATE' && isCrewmateWin)

  const handleBackToLobby = async () => {
    if (!supabaseClient || !roomId || !isHost) return

    try {
      // Reset room status
      await supabaseClient
        .from('rooms')
        .update({ status: 'LOBBY', winner: null })
        .eq('id', roomId)

      // Reset all players
      await supabaseClient
        .from('players')
        .update({ 
          role: 'CREWMATE',
          is_alive: true,
          vote_target: null
        })
        .eq('room_id', roomId)

      // Reset game state
      setGameState({
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

      setCurrentScreen('LOBBY')
    } catch (err) {
      console.error('Error resetting game:', err)
    }
  }

  const handleLeaveGame = () => {
    // Clear local state
    setGameState({
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
    setPlayers([])
    setRoomId(null)
    setPlayerId(null)
    setRoomCode('')
    setPlayerName('')
    setCurrentScreen('LANDING')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className={`card-neon rounded-xl p-8 scanline relative text-center ${
          playerWon ? 'border-neon-cyan' : 'border-gray-700'
        }`}>
          {/* Winner Icon */}
          <div className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center ${
            isImpostorWin 
              ? 'bg-neon-red/20 border-4 border-neon-red neon-border-red' 
              : 'bg-neon-cyan/20 border-4 border-neon-cyan neon-border-cyan'
          }`}>
            {isImpostorWin ? (
              <AlertTriangle className="w-16 h-16 text-neon-red" />
            ) : (
              <Shield className="w-16 h-16 text-neon-cyan" />
            )}
          </div>

          {/* Winner Announcement */}
          <h1 className={`text-4xl font-black mb-4 ${
            isImpostorWin ? 'text-neon-red neon-text-red' : 'text-neon-cyan neon-text-cyan'
          }`}>
            {isImpostorWin ? 'IMPOSTOR WINS' : 'CREWMATES WIN'}
          </h1>

          {/* Player Result */}
          <div className={`p-4 rounded-lg mb-6 ${
            playerWon ? 'bg-green-500/20 border border-green-500' : 'bg-red-500/20 border border-red-500'
          }`}>
            <Trophy className={`w-8 h-8 mx-auto mb-2 ${
              playerWon ? 'text-green-400' : 'text-red-400'
            }`} />
            <p className={`font-bold ${playerWon ? 'text-green-400' : 'text-red-400'}`}>
              {playerWon ? 'VICTORY' : 'DEFEAT'}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              You were {currentPlayer?.role}
            </p>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-dark-card rounded-lg">
              <p className="text-xs text-gray-400 mb-1">YOUR ROLE</p>
              <p className={`font-bold ${
                currentPlayer?.role === 'IMPOSTOR' ? 'text-neon-red' : 'text-neon-cyan'
              }`}>
                {currentPlayer?.role}
              </p>
            </div>
            <div className="p-4 bg-dark-card rounded-lg">
              <p className="text-xs text-gray-400 mb-1">WINNER</p>
              <p className={`font-bold ${
                isImpostorWin ? 'text-neon-red' : 'text-neon-cyan'
              }`}>
                {winner}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {isHost ? (
              <button
                onClick={handleBackToLobby}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-bold py-4 rounded-lg btn-neon"
              >
                <RotateCcw className="w-5 h-5" />
                RETURN TO LOBBY
              </button>
            ) : (
              <div className="p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                <p className="text-sm text-neon-cyan">
                  Waiting for host to start a new round...
                </p>
              </div>
            )}

            <button
              onClick={handleLeaveGame}
              className="w-full border border-gray-600 text-gray-400 font-bold py-3 rounded-lg hover:border-neon-red hover:text-neon-red transition-colors"
            >
              LEAVE GAME
            </button>
          </div>
        </div>

        {/* Credits */}
        <p className="text-center text-gray-600 text-xs mt-6">
          THE IMPOSTOR ENGINE v1.0.0
        </p>
      </div>
    </div>
  )
}
