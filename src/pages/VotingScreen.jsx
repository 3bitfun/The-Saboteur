import { useEffect, useState } from 'react'
import { useApp } from '../lib/AppContext'
import { Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function VotingScreen() {
  const {
    supabaseClient,
    roomId,
    playerId,
    players,
    setPlayers,
    currentPlayer,
    setCurrentScreen,
    gameState,
    setGameState
  } = useApp()

  const [selectedVote, setSelectedVote] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteResults, setVoteResults] = useState([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!supabaseClient || !roomId) return

    // Fetch current votes
    fetchVotes()

    // Subscribe to vote changes
    const channel = supabaseClient
      .channel(`votes:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          fetchVotes()
        }
      )
      .subscribe()

    // Subscribe to room status for ending
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
          if (payload.new.status === 'ENDED') {
            setCurrentScreen('GAME_OVER')
          } else if (payload.new.status === 'GAME') {
            setCurrentScreen('ROLE_REVEAL')
          }
        }
      )
      .subscribe()

    // Timer countdown
    const timerInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.timer <= 0) {
          handleEndVoting()
          return { ...prev, timer: 0 }
        }
        return { ...prev, timer: prev.timer - 1 }
      })
    }, 1000)

    return () => {
      supabaseClient.removeChannel(channel)
      supabaseClient.removeChannel(roomChannel)
      clearInterval(timerInterval)
    }
  }, [supabaseClient, roomId])

  const fetchVotes = async () => {
    if (!supabaseClient || !roomId) return

    try {
      const { data, error } = await supabaseClient
        .from('players')
        .select('*')
        .eq('room_id', roomId)

      if (error) throw error

      const playerList = data.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        is_host: p.is_host,
        is_alive: p.is_alive,
        vote_target: p.vote_target
      }))

      setPlayers(playerList)

      // Calculate vote results
      const alivePlayers = playerList.filter(p => p.is_alive)
      const votes = {}
      alivePlayers.forEach(p => {
        if (p.vote_target) {
          votes[p.vote_target] = (votes[p.vote_target] || 0) + 1
        }
      })

      const results = Object.entries(votes).map(([targetId, count]) => {
        const target = playerList.find(p => p.id === targetId)
        return {
          targetId,
          targetName: target?.name || 'Unknown',
          count,
          percentage: Math.round((count / alivePlayers.length) * 100)
        }
      }).sort((a, b) => b.count - a.count)

      setVoteResults(results)
    } catch (err) {
      console.error('Error fetching votes:', err)
    }
  }

  const handleVote = async (targetId) => {
    if (hasVoted || !supabaseClient) return

    try {
      await supabaseClient
        .from('players')
        .update({ vote_target: targetId })
        .eq('id', playerId)

      setHasVoted(true)
      setSelectedVote(targetId)
    } catch (err) {
      console.error('Error submitting vote:', err)
    }
  }

  const handleEndVoting = async () => {
    if (!supabaseClient || !roomId) return

    try {
      // Determine who got most votes
      const alivePlayers = players.filter(p => p.is_alive)
      const votes = {}
      
      alivePlayers.forEach(p => {
        if (p.vote_target) {
          votes[p.vote_target] = (votes[p.vote_target] || 0) + 1
        }
      })

      let ejectedPlayer = null
      let maxVotes = 0

      Object.entries(votes).forEach(([targetId, count]) => {
        if (count > maxVotes) {
          maxVotes = count
          ejectedPlayer = players.find(p => p.id === targetId)
        } else if (count === maxVotes) {
          // Tie - no one ejected
          ejectedPlayer = null
        }
      })

      // Update ejected player status
      if (ejectedPlayer) {
        await supabaseClient
          .from('players')
          .update({ is_alive: false })
          .eq('id', ejectedPlayer.id)
      }

      // Reset votes
      await supabaseClient
        .from('players')
        .update({ vote_target: null })
        .eq('room_id', roomId)

      setGameState(prev => ({
        ...prev,
        ejectedPlayer: ejectedPlayer ? {
          id: ejectedPlayer.id,
          name: ejectedPlayer.name,
          role: ejectedPlayer.role
        } : null
      }))

      setShowResults(true)

      // After showing results, go back to game or end
      setTimeout(async () => {
        // Check win conditions
        const impostorAlive = players.some(p => p.role === 'IMPOSTOR' && p.is_alive && p.id !== ejectedPlayer?.id)
        const crewmatesAlive = players.filter(p => p.role === 'CREWMATE' && p.is_alive).length

        if (!impostorAlive) {
          // Crewmates win
          await supabaseClient
            .from('rooms')
            .update({ 
              status: 'ENDED',
              winner: 'CREWMATES'
            })
            .eq('id', roomId)
          setCurrentScreen('GAME_OVER')
        } else if (crewmatesAlive <= 1) {
          // Impostor wins
          await supabaseClient
            .from('rooms')
            .update({ 
              status: 'ENDED',
              winner: 'IMPOSTOR'
            })
            .eq('id', roomId)
          setCurrentScreen('GAME_OVER')
        } else {
          // Continue game
          await supabaseClient
            .from('rooms')
            .update({ status: 'GAME' })
            .eq('id', roomId)
          setCurrentScreen('ROLE_REVEAL')
        }
      }, 4000)
    } catch (err) {
      console.error('Error ending voting:', err)
    }
  }

  const alivePlayers = players.filter(p => p.is_alive)
  const votedPlayers = players.filter(p => p.vote_target && p.is_alive)

  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neon-purple neon-text-purple mb-2">
            EMERGENCY MEETING
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="text-4xl font-mono text-neon-red">
              {gameState.timer}s
            </div>
            <div className="text-gray-400">
              {votedPlayers.length} / {alivePlayers.length} voted
            </div>
          </div>
        </div>

        {!showResults ? (
          <>
            {/* Vote Grid */}
            <div className="card-neon rounded-xl p-6 mb-6 scanline relative">
              <h2 className="text-lg font-bold text-neon-cyan mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                SELECT SUSPECT TO EJECT
              </h2>

              {hasVoted && (
                <div className="mb-4 p-3 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
                  <p className="text-sm text-neon-cyan">
                    Vote submitted. Waiting for others...
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {alivePlayers.map(player => {
                  const voteCount = voteResults.find(r => r.targetId === player.id)?.count || 0
                  
                  return (
                    <button
                      key={player.id}
                      onClick={() => handleVote(player.id)}
                      disabled={hasVoted}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedVote === player.id
                          ? 'bg-neon-red/20 border-neon-red'
                          : player.id === playerId
                          ? 'bg-neon-cyan/10 border-neon-cyan cursor-not-allowed'
                          : 'bg-dark-card border-gray-700 hover:border-neon-purple'
                      } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="aspect-square rounded-full bg-gray-800 flex items-center justify-center mb-3 mx-auto w-20">
                        <Users className={`w-10 h-10 ${
                          player.id === playerId ? 'text-neon-cyan' : 'text-gray-400'
                        }`} />
                      </div>
                      <p className="font-bold text-sm truncate">{player.name}</p>
                      {player.id === playerId && (
                        <span className="text-xs text-neon-cyan">(YOU)</span>
                      )}
                      {voteCount > 0 && (
                        <div className="mt-2 text-xs text-neon-red">
                          {voteCount} vote{voteCount > 1 ? 's' : ''}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Live Vote Tally */}
            {voteResults.length > 0 && (
              <div className="card-neon rounded-xl p-6 scanline relative">
                <h3 className="text-lg font-bold text-neon-purple mb-4">LIVE TALLY</h3>
                <div className="space-y-3">
                  {voteResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-32 text-sm truncate">{result.targetName}</div>
                      <div className="flex-1 h-4 bg-dark-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-neon-red to-neon-purple transition-all"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm text-neon-red">
                        {result.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Results Display */
          <div className="card-neon rounded-xl p-8 scanline relative text-center">
            {gameState.ejectedPlayer ? (
              <>
                <AlertCircle className="w-24 h-24 mx-auto mb-4 text-neon-red" />
                <h2 className="text-3xl font-bold text-neon-red mb-4">EJECTED</h2>
                <p className="text-2xl mb-2">{gameState.ejectedPlayer.name}</p>
                <p className={`text-xl font-bold ${
                  gameState.ejectedPlayer.role === 'IMPOSTOR' 
                    ? 'text-neon-red' 
                    : 'text-neon-cyan'
                }`}>
                  {gameState.ejectedPlayer.role === 'IMPOSTOR' ? 'WAS THE IMPOSTOR' : 'WAS NOT THE IMPOSTOR'}
                </p>
              </>
            ) : (
              <>
                <XCircle className="w-24 h-24 mx-auto mb-4 text-gray-500" />
                <h2 className="text-3xl font-bold text-gray-400 mb-4">NO ONE EJECTED</h2>
                <p className="text-xl text-gray-400">Tie vote or no votes cast</p>
              </>
            )}

            <p className="text-sm text-gray-500 mt-8 animate-pulse">
              Returning to station...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
