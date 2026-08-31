# MRPG Realms authored asset blockouts

This phase adds reversible authored Three.js blockouts for the investigated chest, player-model, and sword targets. The previously investigated external source directories are not present on this host, so no external binaries, licenses, or claims are copied into production.

| Target | Runtime asset ID | Status | Fallback |
|---|---|---|---|
| Chest | `chest-authored-blockout-v1` | authored blockout | primitive chest factory |
| Role player | `player-<role>-authored-blockout-v1` | authored blockout | role-colored primitive body |
| Sword | `sword-authored-blockout-v1` | authored blockout | no weapon attachment |

These are silhouette/proportion validation assets, not final imported art. A future imported asset must include its original URL/commit/path, checksum, exact license evidence, front/three-quarter/rear review, and a fail-safe loader path before replacing these factories.

Factories do not own player position, facing, HP, combat legality, or structure persistence. `starterChest` is a local deterministic showcase prop until a server-authoritative chest/loot contract exists.
