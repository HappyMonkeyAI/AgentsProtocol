# ADR-0005: Debug console and voxel render guard

## Status

Accepted

## Context

The voxel terrain used instanced cube meshes with `MeshToonMaterial({ vertexColors: true })`, but the cube geometry had no per-vertex color attribute. The resulting shader input multiplied the instance colors by a black default, making the joined world appear black even though the canvas and HUD were alive.

The prototype also needs a low-friction way to inspect the world without changing the multiplayer protocol.

## Decision

Use the instanced mesh material without the vertex-color flag; instance colors remain the terrain palette. Add a client-only backtick console with `/creative` and `/survival` commands. Creative mode enables free WASD flight with Space/Ctrl vertical movement and expanded mouse pitch. Shift accelerates both survival movement and creative flight.

The console and creative state are debugging tools only. They do not grant server authority, change combat validation, or persist across reloads.

## Verification boundary

The browser acceptance path must confirm a non-black joined render, console open/close, `/creative` visible status, movement state change, and zero page exceptions. Server/shared contracts remain unchanged.
