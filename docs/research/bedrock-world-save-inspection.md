# Bedrock world save inspection

## Local evidence

The uploaded `world/` directory is a Bedrock save copy, not an MRPG-compatible world database:

- `world/level.dat` — 2,201 bytes; Bedrock binary NBT-style world metadata.
- `world/level.dat_old` — metadata backup.
- `world/levelname.txt` — world name (`world`).
- `world/db/` — LevelDB database containing 15 `.ldb` tables, one `.log`, `CURRENT`, and a LevelDB manifest.
- Total uploaded size: approximately 23 MB.
- Metadata strings include `StorageVersion`, `NetworkVersion`, `MinimumCompatibleClientVersion`, `RandomSeed3`, spawn coordinates, game rules, player abilities, and `lastOpenedWithVersion` `1.16.210`.

## Persistence model

Bedrock uses a generated-world metadata file plus a binary LevelDB-backed key/value store. The database contains compact binary records for chunk/subchunk terrain and associated entities/block entities/player/world state. The keys and value schemas are coupled to Bedrock's storage/version implementation; the `.ldb` files are not region files or a portable JSON block map.

## MRPG decision

Do not make MRPG read or write Bedrock's LevelDB directly. Use the uploaded save as a format reference and possible future import source only. MRPG should persist its own versioned world model:

1. `worlds/<normalized-seed>/manifest.json` — schema version, seed, generator version, timestamps, and migration metadata.
2. Chunk records keyed by chunk coordinate — sparse edited voxel mutations initially; generated terrain remains derived from the seed.
3. Structure records — owner, type/blueprint version, position, and creation/update timestamps.
4. Player/profile records — identity and durable progression, separate from transient socket presence.
5. Atomic write/recovery strategy — temporary write, rename, and startup recovery/checksum policy.

The first persistence slice should save only server-authoritative mutations (voxel edits and structures), not generated chunks. This keeps storage small and allows generator changes to be versioned explicitly. A later Bedrock importer could decode `level.dat` and selected LevelDB records into this model, but should never mutate the original upload.

## Safety

The uploaded `world/` directory is local reference data and should remain ignored by Git. Preserve it read-only while investigating; do not open the database with a write-capable LevelDB client.

## Source limitations

Direct Microsoft Learn retrieval was unavailable in this environment (the requested page returned 404 and the configured web-search backend was unavailable). The format observations above are based on the uploaded files themselves and standard file signatures/metadata strings, not a claim of complete Bedrock schema coverage.
