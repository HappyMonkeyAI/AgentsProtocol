export type PlayerRole = 'warrior' | 'ranger' | 'mage' | 'healer' | 'builder';

export type Biome =
  | 'deep_water'
  | 'water'
  | 'sand'
  | 'grass'
  | 'forest'
  | 'rock'
  | 'snow';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  id: string;
  name: string;
  role: PlayerRole;
  position: Vec3;
  yaw: number;
  hp: number;
  maxHp: number;
  color: number;
}

export interface StructureState {
  id: string;
  ownerId: string;
  kind: 'campfire' | 'wall' | 'hut' | 'tower';
  position: Vec3;
  createdAt: number;
}

export interface JoinRequest {
  name: string;
  role: PlayerRole;
  /** Shared world seed — same seed = same terrain + multiplayer room. */
  worldSeed?: string;
}

export interface JoinResponse {
  self: PlayerState;
  players: PlayerState[];
  structures: StructureState[];
  worldSeed: string;
  /** Short invite token (normalized seed); share as ?seed= */
  inviteCode: string;
  chunkSize: number;
  tileSize: number;
  playerCount: number;
}

export interface WorldSummary {
  worldSeed: string;
  inviteCode: string;
  playerCount: number;
  structureCount: number;
}

export interface ChatLikeError {
  message: string;
}

export const ROLE_STATS: Record<PlayerRole, { maxHp: number; color: number; speed: number }> = {
  warrior: { maxHp: 150, color: 0xc45c26, speed: 6.2 },
  ranger: { maxHp: 100, color: 0x3aa655, speed: 7.0 },
  mage: { maxHp: 70, color: 0x6b5cff, speed: 6.0 },
  healer: { maxHp: 90, color: 0x4ecdc4, speed: 6.4 },
  builder: { maxHp: 110, color: 0xd4a017, speed: 5.8 },
};

export const WORLD = {
  chunkSize: 16,
  tileSize: 2,
  loadRadius: 3,
  maxPlayersPerWorld: 32,
} as const;

/** Normalize user/invite seeds so "Forest-01" and " forest 01 " map to one room. */
export function normalizeWorldSeed(raw: string | undefined | null, fallback = 'mrpg-realms-dev'): string {
  const cleaned = (raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return cleaned || fallback;
}

export function randomWorldSeed(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = 'realm-';
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}
