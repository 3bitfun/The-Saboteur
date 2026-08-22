-- The Impostor Engine - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'GAME', 'VOTING', 'ENDED')),
  winner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on room code for faster lookups
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CREWMATE' CHECK (role IN ('CREWMATE', 'IMPOSTOR')),
  is_host BOOLEAN NOT NULL DEFAULT false,
  is_alive BOOLEAN NOT NULL DEFAULT true,
  vote_target UUID REFERENCES players(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for players table
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_players_vote_target ON players(vote_target);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policies for rooms table
-- Allow anyone to read rooms (for joining)
CREATE POLICY "Allow public read access to rooms"
  ON rooms FOR SELECT
  USING (true);

-- Allow anyone to insert rooms (for creating)
CREATE POLICY "Allow public insert access to rooms"
  ON rooms FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update rooms (for game state changes)
CREATE POLICY "Allow public update access to rooms"
  ON rooms FOR UPDATE
  USING (true);

-- Allow anyone to delete rooms (for cleanup)
CREATE POLICY "Allow public delete access to rooms"
  ON rooms FOR DELETE
  USING (true);

-- Create policies for players table
-- Allow anyone to read players in any room
CREATE POLICY "Allow public read access to players"
  ON players FOR SELECT
  USING (true);

-- Allow anyone to insert players (for joining)
CREATE POLICY "Allow public insert access to players"
  ON players FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update players (for voting, role assignment, etc.)
CREATE POLICY "Allow public update access to players"
  ON players FOR UPDATE
  USING (true);

-- Allow anyone to delete players (for leaving)
CREATE POLICY "Allow public delete access to players"
  ON players FOR DELETE
  USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Insert some test data (optional - comment out in production)
-- INSERT INTO rooms (id, code, status) VALUES 
--   (uuid_generate_v4(), 'TEST', 'LOBBY');
