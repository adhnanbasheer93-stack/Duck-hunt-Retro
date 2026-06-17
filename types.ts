export enum GameState {
  START = 'START',
  COUNTDOWN = 'COUNTDOWN',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER'
}

export interface HighScore {
  id?: string;
  score: number;
  date: string;
  name: string;
  accuracy: number;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  size: number;
}

export type ShootingMode = 'PINCH' | 'HOVER' | 'CLICK';

export interface GameSettings {
  shootingMode: ShootingMode;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  soundEnabled: boolean;
  cameraEnabled: boolean;
}

export type DuckType = 'NORMAL' | 'FAST' | 'GOLDEN' | 'BOSS';

export interface DuckConfig {
  type: DuckType;
  color: string;
  accentColor: string;
  beakColor: string;
  speed: number;
  points: number;
  size: number;
  pitch: number;
  desc: string;
}

export const DUCK_TYPES: Record<DuckType, DuckConfig> = {
  NORMAL: {
    type: 'NORMAL',
    color: '#855E42', // Brown
    accentColor: '#1a4314', // Green head
    beakColor: '#FFA500', // Orange
    speed: 1.6, // reduced from 2.2
    points: 10,
    size: 48,
    pitch: 440,
    desc: 'Normal Mallard - 10 pts'
  },
  FAST: {
    type: 'FAST',
    color: '#0055FF', // Blue
    accentColor: '#FFFFFF', // White neck ring
    beakColor: '#FFA500',
    speed: 3.2, // reduced from 4.5
    points: 20,
    size: 40,
    pitch: 620,
    desc: 'Blue Pintail - 20 pts'
  },
  GOLDEN: {
    type: 'GOLDEN',
    color: '#FFD700', // Metallic Gold
    accentColor: '#FFF3A8', // Shimmering light gold
    beakColor: '#FF6F00',
    speed: 5.0, // reduced from 7.0
    points: 50,
    size: 36,
    pitch: 950,
    desc: 'Golden Phoenix - 50 pts'
  },
  BOSS: {
    type: 'BOSS',
    color: '#E02424', // Power Crimson / Red
    accentColor: '#4B5563', // Iron grey crest
    beakColor: '#F59E0B',
    speed: 0.9, // slow and heavy
    points: 150,
    size: 96, // massive scaling (double size)
    pitch: 220, // super deep base tone
    desc: 'Mega King Mallard [5 HITS] - 150 pts'
  }
};
