import express from 'express';
import cors from 'cors';
import http from 'node:http';
import { Server } from 'socket.io';
import {
  JoinRequest,
  JoinResponse,
  StructureState,
  CombatEffect,
  ChatMessage,
  VoiceTranscriptionRequest,
  VoiceTranscriptionResult,
  WORLD,
  PlayerRole,
  normalizeWorldSeed,
} from '../../shared/protocol';
import { getHelpText, parseSlashCommand } from '../../shared/commands';
import { RoomRegistry } from './world/Room';
import { validateVoiceClip } from './voice/audioPolicy';
import { createTranscriptionProvider } from './voice/transcription';

const PORT = Number(process.env.PORT || 9402);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || true; // allow any origin in dev multiplayer
const DEFAULT_SEED = process.env.WORLD_SEED || 'mrpg-realms-dev';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

const registry = new RoomRegistry();
const chatActivity = new Map<string, number[]>();
const voiceActivity = new Map<string, number[]>();
const transcriptionProvider = createTranscriptionProvider();

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

function chatMessage(socketId: string, text: string, name: string, role: PlayerRole, voice = false): ChatMessage {
  return {
    id: `${socketId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: socketId,
    senderName: name,
    senderRole: role,
    text,
    createdAt: Date.now(),
    ...(voice ? { voice: true } : {}),
  };
}

function canChat(socketId: string): boolean {
  const now = Date.now();
  const recent = (chatActivity.get(socketId) || []).filter((time) => now - time < 10_000);
  if (recent.length >= 8) {
    chatActivity.set(socketId, recent);
    return false;
  }
  recent.push(now);
  chatActivity.set(socketId, recent);
  return true;
}

function canTranscribe(socketId: string): boolean {
  const now = Date.now();
  const recent = (voiceActivity.get(socketId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= 6) {
    voiceActivity.set(socketId, recent);
    return false;
  }
  recent.push(now);
  voiceActivity.set(socketId, recent);
  return true;
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

  const sendChat = (data: { text?: string }, voice = false) => {
    const room = registry.roomForSocket(socket.id);
    const player = room?.players.get(socket.id);
    if (!room || !player) return;
    if (!canChat(socket.id)) {
      socket.emit('chat:system', chatMessage('system', 'You are sending messages too quickly.', 'Realm', 'builder'));
      return;
    }
    const text = String(data?.text || '').trim().slice(0, 240);
    if (!text || parseSlashCommand(text)) {
      if (text.startsWith('/')) {
        socket.emit('chat:system', chatMessage('system', 'Unknown command. Try /help commands.', 'Realm', 'builder'));
      }
      return;
    }
    io.to(roomChannel(room.worldSeed)).emit('chat:message', chatMessage(socket.id, text, player.name, player.role, voice));
    room.touch();
  };

  socket.on('chat:send', (data: { text?: string }) => sendChat(data));
  socket.on('voice:send-transcript', (data: { text?: string }) => sendChat(data, true));

  socket.on('chat:help', (topic: string, ack?: (text: string) => void) => {
    ack?.(getHelpText(typeof topic === 'string' ? topic : 'overview'));
  });

  socket.on('voice:transcribe', async (data: Partial<VoiceTranscriptionRequest>) => {
    const now = Date.now();
    const room = registry.roomForSocket(socket.id);
    const player = room?.players.get(socket.id);
    const result = (status: 'unavailable' | 'rejected', reason: string): VoiceTranscriptionResult => ({ status, reason, createdAt: now });
    if (!room || !player) return socket.emit('voice:result', result('rejected', 'join a realm before using voice'));
    if (!canTranscribe(socket.id)) return socket.emit('voice:result', result('rejected', 'voice transcription rate limit reached'));

    const audio = data?.audio instanceof Uint8Array ? data.audio : null;
    const mimeType = typeof data?.mimeType === 'string' ? data.mimeType : '';
    const durationMs = Number(data?.durationMs);
    if (!audio) return socket.emit('voice:result', result('rejected', 'invalid audio payload'));
    const policy = validateVoiceClip({ bytes: audio, mimeType, durationMs });
    if (!policy.ok) return socket.emit('voice:result', result('rejected', policy.reason));

    try {
      const transcription = await transcriptionProvider.transcribe({ audio, mimeType });
      if ('error' in transcription) return socket.emit('voice:result', result('unavailable', transcription.error));
      const transcript = transcription.text.trim().slice(0, 240);
      if (!transcript) return socket.emit('voice:result', result('unavailable', 'no speech detected'));
      socket.emit('voice:result', { status: 'transcript', transcript, createdAt: now } satisfies VoiceTranscriptionResult);
    } catch {
      socket.emit('voice:result', result('unavailable', 'voice provider request failed'));
    }
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
    if (attacker.role !== 'healer') {
      const effect: CombatEffect = {
        kind: attacker.role === 'mage' ? 'impact' : 'slash',
        attackerId: attacker.id,
        targetId: target.id,
        createdAt: Date.now(),
      };
      io.to(roomChannel(room.worldSeed)).emit('combat:effect', effect);
    }
    io.to(roomChannel(room.worldSeed)).emit('player:hp', { id: target.id, hp: target.hp });
  });

  socket.on('disconnect', () => {
    chatActivity.delete(socket.id);
    voiceActivity.delete(socket.id);
    const room = registry.unbindSocket(socket.id);
    if (room) {
      socket.to(roomChannel(room.worldSeed)).emit('player:leave', socket.id);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[mrpg-realms] multiplayer server on :${PORT} defaultSeed=${normalizeWorldSeed(DEFAULT_SEED)}`);
});
