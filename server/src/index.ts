import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';
import {
  JoinRequest,
  JoinResponse,
  StructureState,
  WORLD,
  PlayerRole,
  normalizeWorldSeed,
} from '../../shared/protocol';
import { RoomRegistry } from './world/Room';

const PORT = Number(process.env.PORT || 9402);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || true; // allow any origin in dev multiplayer
const DEFAULT_SEED = process.env.WORLD_SEED || 'mrpg-realms-dev';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const registry = new RoomRegistry();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mrpg-realms',
    players: registry.totalPlayers(),
    worlds: registry.listActive(),
    defaultSeed: normalizeWorldSeed(DEFAULT_SEED),
  });
});

app.get('/api/worlds', (_req, res) => {
  res.json({ worlds: registry.listActive() });
});

app.get('/api/invite/:code', (req, res) => {
  const seed = normalizeWorldSeed(req.params.code, DEFAULT_SEED);
  const room = registry.getOrCreate(seed);
  res.json({
    worldSeed: room.worldSeed,
    inviteCode: room.inviteCode,
    playerCount: room.players.size,
    structureCount: room.structures.size,
    joinHint: `Open the client with ?seed=${encodeURIComponent(room.inviteCode)}`,
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN },
});

function sanitizeName(name: string): string {
  return (name || 'Wanderer').trim().slice(0, 24) || 'Wanderer';
}

function isRole(v: string): v is PlayerRole {
  return ['warrior', 'ranger', 'mage', 'healer', 'builder'].includes(v);
}

function roomChannel(seed: string) {
  return `world:${seed}`;
}

io.on('connection', (socket) => {
  socket.on('join', (req: JoinRequest, ack?: (res: JoinResponse | { error: string }) => void) => {
    // Leave previous room if reconnecting join
    const prev = registry.roomForSocket(socket.id);
    if (prev) {
      socket.leave(roomChannel(prev.worldSeed));
      registry.unbindSocket(socket.id);
      socket.to(roomChannel(prev.worldSeed)).emit('player:leave', socket.id);
    }

    const role = isRole(req?.role) ? req.role : 'warrior';
    const room = registry.getOrCreate(req?.worldSeed || DEFAULT_SEED);
    if (!registry.canJoin(room)) {
      ack?.({ error: `world full (max ${WORLD.maxPlayersPerWorld})` });
      return;
    }

    const self = room.createPlayer(socket.id, sanitizeName(req?.name), role);
    registry.bindSocket(socket.id, room.worldSeed);
    void socket.join(roomChannel(room.worldSeed));

    socket.to(roomChannel(room.worldSeed)).emit('player:join', self);

    const payload: JoinResponse = {
      self,
      players: [...room.players.values()],
      structures: [...room.structures.values()],
      worldSeed: room.worldSeed,
      inviteCode: room.inviteCode,
      chunkSize: WORLD.chunkSize,
      tileSize: WORLD.tileSize,
      playerCount: room.players.size,
    };
    ack?.(payload);
  });

  socket.on('player:update', (data: { position: { x: number; y: number; z: number }; yaw: number }) => {
    const room = registry.roomForSocket(socket.id);
    const p = room?.players.get(socket.id);
    if (!room || !p || !data?.position) return;
    p.position = {
      x: Number(data.position.x) || 0,
      y: Number(data.position.y) || 0,
      z: Number(data.position.z) || 0,
    };
    p.yaw = Number(data.yaw) || 0;
    room.touch();
    socket.to(roomChannel(room.worldSeed)).emit('player:update', {
      id: socket.id,
      position: p.position,
      yaw: p.yaw,
    });
  });

  socket.on(
    'structure:place',
    (
      data: { kind: StructureState['kind']; position: StructureState['position'] },
      ack?: (r: StructureState | { error: string }) => void,
    ) => {
      const room = registry.roomForSocket(socket.id);
      const p = room?.players.get(socket.id);
      if (!room || !p) return ack?.({ error: 'not joined' });
      if (p.role !== 'builder') return ack?.({ error: 'only builders place structures' });
      const kind = data?.kind || 'campfire';
      if (!['campfire', 'wall', 'hut', 'tower'].includes(kind)) return ack?.({ error: 'bad kind' });
      const st: StructureState = {
        id: `${socket.id}-${Date.now()}`,
        ownerId: socket.id,
        kind,
        position: {
          x: Number(data.position?.x) || p.position.x,
          y: Number(data.position?.y) || p.position.y,
          z: Number(data.position?.z) || p.position.z,
        },
        createdAt: Date.now(),
      };
      room.structures.set(st.id, st);
      room.touch();
      io.to(roomChannel(room.worldSeed)).emit('structure:add', st);
      ack?.(st);
    },
  );

  socket.on('combat:hit', (data: { targetId: string }) => {
    const room = registry.roomForSocket(socket.id);
    if (!room) return;
    const attacker = room.players.get(socket.id);
    const target = room.players.get(data?.targetId);
    if (!attacker || !target || attacker.id === target.id) return;
    if (attacker.role === 'builder') return;

    const dx = attacker.position.x - target.position.x;
    const dz = attacker.position.z - target.position.z;
    const dist = Math.hypot(dx, dz);
    const range = attacker.role === 'warrior' ? 2.8 : attacker.role === 'healer' ? 6 : 12;
    if (dist > range) return;

    if (attacker.role === 'healer') {
      target.hp = Math.min(target.maxHp, target.hp + 12);
    } else {
      const dmg = attacker.role === 'mage' ? 18 : attacker.role === 'ranger' ? 12 : 15;
      target.hp = Math.max(0, target.hp - dmg);
      if (target.hp === 0) {
        const pos = room.spawnPoint();
        target.position = pos;
        target.hp = target.maxHp;
        io.to(roomChannel(room.worldSeed)).emit('player:respawn', {
          id: target.id,
          position: pos,
          hp: target.hp,
        });
      }
    }
    room.touch();
    io.to(roomChannel(room.worldSeed)).emit('player:hp', { id: target.id, hp: target.hp });
  });

  socket.on('disconnect', () => {
    const room = registry.unbindSocket(socket.id);
    if (room) {
      socket.to(roomChannel(room.worldSeed)).emit('player:leave', socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mrpg-realms] multiplayer server on :${PORT} defaultSeed=${normalizeWorldSeed(DEFAULT_SEED)}`);
});
