import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext'
import { Eye, EyeOff, AlertTriangle, Wrench, Zap, ShieldAlert } from 'lucide-react'

export default function RoleRevealScreen() {
  const {
    supabaseClient,
    roomId,
    playerId,
    players,
    currentPlayer,
    setCurrentScreen,
    setGameState,
    setShowRoleReveal,
    gameState,
    revealedRole,
    setRevealedRole
  } = useApp()

  const [isPressing, setIsPressing] = useState(false)
  const [pressDuration, setPressDuration] = useState(0)
  const [hasRevealed, setHasRevealed] = useState(false)
  const [showGameplay, setShowGameplay] = useState(false)

  const isImpostor = currentPlayer?.role === 'IMPOSTOR'

  useEffect(() => {
    let interval
    if (isPressing && pressDuration < 3000) {
      interval = setInterval(() => {
        setPressDuration(prev => {
          if (prev >= 3000) {
            revealRole()
            return 3000
          }
          return prev + 50
        })
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isPressing, pressDuration])

  const handleMouseDown = () => {
    if (!hasRevealed) {
      setIsPressing(true)
      setPressDuration(0)
    }
  }

  const handleMouseUp = () => {
    if (!hasRevealed && pressDuration < 3000) {
      setIsPressing(false)
      setPressDuration(0)
    }
  }

  const revealRole = () => {
    setIsPressing(false)
    setHasRevealed(true)
    setRevealedRole(currentPlayer?.role)
    setTimeout(() => {
      setShowGameplay(true)
    }, 2000)
  }

  const handleEmergencyMeeting = async () => {
    if (!supabaseClient || !roomId) return

    try {
      await supabaseClient
        .from('rooms')
        .update({ status: 'VOTING' })
        .eq('id', roomId)

      setGameState(prev => ({
        ...prev,
        status: 'VOTING',
        timer: 30
      }))

      setCurrentScreen('VOTING')
    } catch (err) {
      console.error('Error calling meeting:', err)
    }
  }

  if (!showGameplay) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {!hasRevealed ? (
            <div className="card-neon rounded-xl p-8 scanline relative text-center">
              <h2 className="text-2xl font-bold text-neon-cyan mb-6 neon-text-cyan">
                SECURITY CLEARANCE REQUIRED
              </h2>
              
              <div className="mb-6">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-neon-purple flex items-center justify-center bg-dark-card">
                  {isPressing ? (
                    <Eye className="w-16 h-16 text-neon-purple" />
                  ) : (
                    <EyeOff className="w-16 h-16 text-gray-600" />
                  )}
                </div>
              </div>

              <p className="text-gray-400 mb-6 text-sm">
                PRESS AND HOLD TO REVEAL YOUR CLASSIFIED ROLE
              </p>

              <button
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchEnd={handleMouseUp}
                className={`w-full py-6 rounded-xl font-bold text-lg transition-all ${
                  isPressing
                    ? 'bg-gradient-to-r from-neon-purple to-neon-cyan text-dark-bg scale-105'
                    : 'bg-dark-card border-2 border-neon-purple/50 text-neon-purple hover:border-neon-purple'
                }`}
              >
                {isPressing ? `${Math.round((pressDuration / 3000) * 100)}%` : 'HOLD TO REVEAL'}
              </button>

              <div className="mt-4 h-2 bg-dark-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-neon-purple to-neon-cyan transition-all duration-100"
                  style={{ width: `${(pressDuration / 3000) * 100}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-4">
                Keep holding until the bar fills completely
              </p>
            </div>
          ) : (
            <div className="card-neon rounded-xl p-8 scanline relative text-center animate-pulse">
              <div className={`w-40 h-40 mx-auto rounded-full flex items-center justify-center mb-6 ${
                isImpostor 
                  ? 'bg-neon-red/20 border-4 border-neon-red neon-border-red' 
                  : 'bg-neon-cyan/20 border-4 border-neon-cyan neon-border-cyan'
              }`}>
                {isImpostor ? (
                  <AlertTriangle className="w-20 h-20 text-neon-red" />
                ) : (
                  <ShieldAlert className="w-20 h-20 text-neon-cyan" />
                )}
              </div>

              <h2 className={`text-4xl font-black mb-2 ${
                isImpostor ? 'text-neon-red neon-text-red' : 'text-neon-cyan neon-text-cyan'
              }`}>
                {isImpostor ? 'IMPOSTOR' : 'CREWMATE'}
              </h2>

              <p className="text-gray-400 mb-6">
                {isImpostor 
                  ? 'Sabotage and eliminate without being caught' 
                  : 'Complete tasks and identify the impostor'}
              </p>

              <p className="text-sm text-neon-purple animate-pulse">
                LOADING STATION SYSTEMS...
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Gameplay screen
  return (
    <div className="min-h-screen bg-dark-bg p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${
              isImpostor ? 'text-neon-red neon-text-red' : 'text-neon-cyan neon-text-cyan'
            }`}>
              {isImpostor ? 'IMPOSTOR MODE' : 'CREWMATE MODE'}
            </h1>
            <p className="text-sm text-gray-400">Station Systems Online</p>
          </div>
          <button
            onClick={handleEmergencyMeeting}
            className="flex items-center gap-2 bg-neon-red text-white font-bold px-6 py-3 rounded-lg btn-neon animate-pulse"
          >
            <AlertTriangle className="w-5 h-5" />
            EMERGENCY MEETING
          </button>
        </div>

        {/* Main gameplay area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Task/Game area */}
          <div className="lg:col-span-2 card-neon rounded-xl p-6 scanline relative min-h-[400px]">
            {isImpostor ? (
              <ImpostorGameplay gameState={gameState} setGameState={setGameState} />
            ) : (
              <CrewmateGameplay gameState={gameState} setGameState={setGameState} supabaseClient={supabaseClient} roomId={roomId} playerId={playerId} />
            )}
          </div>

          {/* Player status sidebar */}
          <div className="card-neon rounded-xl p-6 scanline relative">
            <h3 className="text-lg font-bold text-neon-purple mb-4">STATION STATUS</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-dark-card rounded-lg">
                <p className="text-xs text-gray-400 mb-1">YOUR ROLE</p>
                <p className={`font-bold ${isImpostor ? 'text-neon-red' : 'text-neon-cyan'}`}>
                  {currentPlayer?.role}
                </p>
              </div>

              <div className="p-4 bg-dark-card rounded-lg">
                <p className="text-xs text-gray-400 mb-1">ALIVE CREW</p>
                <p className="font-bold text-white">
                  {players.filter(p => p.is_alive).length} / {players.length}
                </p>
              </div>

              {!isImpostor && (
                <div className="p-4 bg-dark-card rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">TASKS COMPLETED</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-dark-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-neon-cyan transition-all"
                        style={{ width: `${(gameState.tasksCompleted / gameState.totalTasks) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-neon-cyan">
                      {gameState.tasksCompleted}/{gameState.totalTasks}
                    </span>
                  </div>
                </div>
              )}

              {isImpostor && (
                <div className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-lg">
                  <p className="text-xs text-neon-red mb-1">SABOTAGE STATUS</p>
                  <p className={`font-bold ${gameState.sabotageActive ? 'text-neon-red animate-pulse' : 'text-gray-400'}`}>
                    {gameState.sabotageActive ? 'ACTIVE' : 'READY'}
                  </p>
                </div>
              )}
            </div>

            {/* Player list */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-gray-400 mb-3">CREW MANIFEST</h4>
              <div className="space-y-2">
                {players.map(player => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.id === playerId ? 'bg-neon-cyan/10' : 'bg-dark-card'
                    } ${!player.is_alive ? 'opacity-50' : ''}`}
                  >
                    <span className={`text-sm ${
                      player.id === playerId ? 'text-neon-cyan' : 'text-white'
                    }`}>
                      {player.name} {player.id === playerId && '(YOU)'}
                    </span>
                    {!player.is_alive && (
                      <span className="text-xs text-neon-red">ELIMINATED</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CrewmateGameplay({ gameState, setGameState, supabaseClient, roomId, playerId }) {
  const [currentTask, setCurrentTask] = useState(0)
  const [taskProgress, setTaskProgress] = useState(0)

  const tasks = [
    { name: 'Wiring System', icon: Zap, color: 'text-yellow-400' },
    { name: 'Fuel Injectors', icon: Wrench, color: 'text-orange-400' },
    { name: 'Navigation Data', icon: ShieldAlert, color: 'text-blue-400' },
    { name: 'Shield Generator', icon: ShieldAlert, color: 'text-purple-400' },
  ]

  const handleTaskClick = () => {
    if (taskProgress >= 100) {
      // Task complete
      const newCompleted = Math.min(gameState.tasksCompleted + 1, gameState.totalTasks)
      setGameState(prev => ({ ...prev, tasksCompleted: newCompleted }))
      
      if (currentTask < tasks.length - 1) {
        setCurrentTask(prev => prev + 1)
        setTaskProgress(0)
      }
    } else {
      setTaskProgress(prev => Math.min(prev + 25, 100))
    }
  }

  const CurrentIcon = tasks[currentTask].icon

  return (
    <div>
      <h3 className="text-lg font-bold text-neon-cyan mb-4">MAINTENANCE TASKS</h3>
      
      <div className="grid grid-cols-4 gap-2 mb-6">
        {tasks.map((task, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg text-center ${
              index === currentTask 
                ? 'bg-neon-cyan/20 border border-neon-cyan' 
                : index < currentTask
                ? 'bg-green-500/20 border border-green-500'
                : 'bg-dark-card border border-gray-700'
            }`}
          >
            <task.icon className={`w-6 h-6 mx-auto mb-1 ${task.color}`} />
            <p className="text-xs truncate">{task.name}</p>
          </div>
        ))}
      </div>

      <div
        onClick={handleTaskClick}
        className="aspect-video bg-dark-card rounded-xl border-2 border-neon-cyan/50 flex flex-col items-center justify-center cursor-pointer hover:border-neon-cyan transition-colors"
      >
        <CurrentIcon className={`w-20 h-20 mb-4 ${tasks[currentTask].color}`} />
        <p className="text-lg font-bold mb-2">{tasks[currentTask].name}</p>
        <p className="text-sm text-gray-400 mb-4">
          {taskProgress >= 100 ? 'CLICK TO COMPLETE' : `PROGRESS: ${taskProgress}%`}
        </p>
        <div className="w-48 h-4 bg-dark-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-neon-cyan transition-all"
            style={{ width: `${taskProgress}%` }}
          />
        </div>
      </div>

      {gameState.tasksCompleted >= gameState.totalTasks && (
        <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg text-center">
          <p className="text-green-400 font-bold">ALL TASKS COMPLETE! WAIT FOR VOTE...</p>
        </div>
      )}
    </div>
  )
}

function ImpostorGameplay({ gameState, setGameState }) {
  const handleSabotage = () => {
    setGameState(prev => ({
      ...prev,
      sabotageActive: !prev.sabotageActive
    }))
  }

  const sabotages = [
    { name: 'O2 Depletion', status: false },
    { name: 'Reactor Meltdown', status: false },
    { name: 'Comms Disruption', status: gameState.sabotageActive },
    { name: 'Door Lockdown', status: false },
  ]

  return (
    <div>
      <h3 className="text-lg font-bold text-neon-red mb-4">SABOTAGE CONTROL</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {sabotages.map((sabotage, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border ${
              sabotage.status 
                ? 'bg-neon-red/20 border-neon-red' 
                : 'bg-dark-card border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">{sabotage.name}</span>
              <div className={`w-3 h-3 rounded-full ${
                sabotage.status ? 'bg-neon-red animate-pulse' : 'bg-gray-600'
              }`} />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSabotage}
        className={`w-full py-4 rounded-xl font-bold text-lg mb-6 ${
          gameState.sabotageActive
            ? 'bg-neon-red text-white animate-pulse'
            : 'bg-dark-card border-2 border-neon-red text-neon-red hover:bg-neon-red/10'
        }`}
      >
        {gameState.sabotageActive ? 'SABOTAGE ACTIVE' : 'ACTIVATE SABOTAGE'}
      </button>

      <div className="p-4 bg-neon-red/10 border border-neon-red/30 rounded-lg">
        <p className="text-xs text-neon-red mb-2">FAKE TASK OBJECTIVES:</p>
        <ul className="text-sm space-y-1 text-gray-300">
          <li>• Download Security Footage</li>
          <li>• Swipe Access Card</li>
          <li>• Submit Scan Data</li>
        </ul>
      </div>
    </div>
  )
}
