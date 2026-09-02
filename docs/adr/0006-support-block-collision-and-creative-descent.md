# ADR-0006: Support-block collision and safe creative descent

## Status

Accepted

## Context

The voxel prototype originally used the highest solid block in the player’s current column as the vertical movement target. That works for surface walking but makes underground spaces impossible: after mining above or beside the player, the movement loop can snap the player back to the column surface. Creative descent also used Ctrl, so pressing Ctrl+W could reach the browser’s close-tab shortcut.

## Decision

Resolve survival support from the edited voxel column at the block immediately beneath the player’s feet. A player is grounded only when that block is solid; open space below the surface is preserved and gravity settles onto the next solid block. Removed and placed block edits participate in the same query.

Creative flight keeps Ctrl as a compatibility descent key, adds Q for descent and E for ascent, and prevents Ctrl+W from invoking the browser default action while creative mode is active.

## Consequences

- Underground tunnels and mined shafts are occupiable in the client prototype.
- Surface stepping and falling require more explicit collision work as movement becomes more physical; horizontal wall/head collision remains future work.
- Q/E provide browser-safe creative flight controls without changing the multiplayer protocol.
- The client remains responsible for this prototype movement presentation; server-authoritative movement validation is a later hardening slice.

## Verification boundary

Static verification uses `npm run typecheck`, `npm test`, and `npm run build`. Browser verification must cover support-block mining, tunnel occupancy, creative Q/E flight, Ctrl+W prevention, and zero page exceptions. See `docs/TESTING.md`.
