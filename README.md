# The Impostor Engine

A real-time multiplayer social deduction party game built with React, Tailwind CSS, and Supabase.

## Features

- **Real-time Multiplayer**: Live synchronization using Supabase Realtime
- **Retro-Futuristic Design**: Dark mode with neon cyan, purple, and red accents
- **Complete Game Flow**:
  - Landing/Join Room screen with Supabase configuration
  - Real-time Lobby with player list
  - Secret Role Reveal (Press & Hold mechanic)
  - Crewmate Tasks (interactive mini-games)
  - Impostor Sabotage Dashboard
  - Emergency Meeting & Voting System
  - Game Over & Victory Screens

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS with custom neon theme
- **Icons**: Lucide React
- **Backend/Database**: Supabase (PostgreSQL + Realtime)
- **Routing**: React Router DOM

## Setup Instructions

### 1. Install Dependencies

```bash
cd impostor-engine
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL to create the required tables

### 3. Get Your Supabase Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbG...`)

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

Restart the development server after changing `.env`. These values are used automatically by the app.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## How to Play

### Creating a Room
1. Enter your player name
2. Click "CREATE ROOM"
3. Share the 4-letter room code with friends

### Joining a Room
1. Enter your player name
2. Enter the 4-letter room code
3. Click "JOIN ROOM"

### Gameplay

#### As a Crewmate:
- Complete all tasks by clicking on them repeatedly
- Watch for suspicious behavior
- Call emergency meetings if you spot the impostor
- Vote to eject suspected impostors

#### As an Impostor:
- Pretend to do tasks
- Use the sabotage button to create chaos
- Blend in with crewmates
- Avoid being voted out

### Winning Conditions
- **Crewmates Win**: All tasks completed OR impostor is ejected
- **Impostor Wins**: Number of impostors equals number of crewmates

## Project Structure

```
impostor-engine/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Screen components
│   │   ├── LandingScreen.jsx
│   │   ├── LobbyScreen.jsx
│   │   ├── RoleRevealScreen.jsx
│   │   ├── VotingScreen.jsx
│   │   └── GameOverScreen.jsx
│   ├── lib/             # Utilities and context
│   │   ├── supabase.js
│   │   └── AppContext.jsx
│   ├── index.css        # Global styles
│   └── main.jsx         # Entry point
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── supabase-schema.sql
```

## Customization

### Theme Colors
Edit `tailwind.config.js` to customize the neon colors:

```js
colors: {
  neon: {
    cyan: '#00ffff',
    purple: '#bf00ff',
    red: '#ff003c',
  }
}
```

### Game Settings
Modify game parameters in `src/lib/AppContext.jsx`:
- Timer duration
- Number of tasks
- Player limits

## License

MIT License - Feel free to use and modify for your own projects!
