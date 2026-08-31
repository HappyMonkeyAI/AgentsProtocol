import {
  PlayerState,
  StructureState,
  ROLE_STATS,
  PlayerRole,
  normalizeWorldSeed,
  WORLD,
} from '../../../shared/protocol';
import { makeHeightFn, heightToBiome, isWalkable } from '../../../shared/noiseWorld';

export class WorldRoom {
  readonly worldSeed: string;
  readonly inviteCode: string;
  readonly players = new Map<string, PlayerState>();
  readonly structures = new Map<string, StructureState>();
  readonly heightAt: (x: number, z: number) => number;
  lastActiveAt = Date.now();

  constructor(worldSeed: string) {
    this.worldSeed = worldSeed;
    this.inviteCode = worldSeed;
    this.heightAt = makeHeightFn(worldSeed);
  }

  touch() {
    this.lastActiveAt = Date.now();
  }

  spawnPoint(): { x: number; y: number; z: number } {
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 40;
      const z = (Math.random() - 0.5) * 40;
      const h = this.heightAt(x, z);
      if (isWalkable(heightToBiome(h))) {
        return { x, y: Math.max(0.9, h + 1.1), z };
      }
    }
    return { x: 0, y: 2, z: 0 };
  }

  createPlayer(id: string, name: string, role: PlayerRole): PlayerState {
    const stats = ROLE_STATS[role];
    const pos = this.spawnPoint();
    const self: PlayerState = {
      id,
      name,
      role,
      position: pos,
      yaw: 0,
      hp: stats.maxHp,
      maxHp: stats.maxHp,
      color: stats.color,
    };
    this.players.set(id, self);
    this.touch();
    return self;
  }

  summary() {
    return {
      worldSeed: this.worldSeed,
      inviteCode: this.inviteCode,
      playerCount: this.players.size,
      structureCount: this.structures.size,
    };
  }
}

export class RoomRegistry {
  private rooms = new Map<string, WorldRoom>();
  private socketRoom = new Map<string, string>(); // socketId -> seed

  getOrCreate(rawSeed: string | undefined): WorldRoom {
    const seed = normalizeWorldSeed(rawSeed);
    let room = this.rooms.get(seed);
    if (!room) {
      room = new WorldRoom(seed);
      this.rooms.set(seed, room);
    }
    room.touch();
    return room;
  }

  roomForSocket(socketId: string): WorldRoom | undefined {
    const seed = this.socketRoom.get(socketId);
    return seed ? this.rooms.get(seed) : undefined;
  }

  bindSocket(socketId: string, seed: string) {
    this.socketRoom.set(socketId, seed);
  }

  unbindSocket(socketId: string): WorldRoom | undefined {
    const seed = this.socketRoom.get(socketId);
    this.socketRoom.delete(socketId);
    if (!seed) return undefined;
    const room = this.rooms.get(seed);
    if (!room) return undefined;
    room.players.delete(socketId);
    room.touch();
    if (room.players.size === 0 && room.structures.size === 0) {
      // Drop empty non-default rooms after idle to avoid leak; keep default briefly
      this.rooms.delete(seed);
      return undefined;
    }
    return room;
  }

  listActive() {
    return [...this.rooms.values()]
      .filter((r) => r.players.size > 0)
      .map((r) => r.summary())
      .sort((a, b) => b.playerCount - a.playerCount);
  }

  totalPlayers() {
    let n = 0;
    for (const r of this.rooms.values()) n += r.players.size;
    return n;
  }

  canJoin(room: WorldRoom): boolean {
    return room.players.size < WORLD.maxPlayersPerWorld;
  }
}
