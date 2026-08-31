# MANIFEST

## In scope (MVP → v1)

- Role select: warrior, ranger, mage, healer, builder
- Seeded chunked heightfield world in Three.js
- Multiplayer presence + basic class hit/heal
- Builder structure place + broadcast
- Agents Protocol docs + LTM seed

## Out of scope (for now)

- Full GatherRealms economy / unit AI port
- Full MRPG mob tier tables / bosses
- Voxel editing / Minecraft dig
- Mobile touch polish
- Public nginx/TLS deploy

## Components

- `client/` Vite Three.js client
- `server/` Socket.IO authority
- `shared/` protocol + noise helpers
