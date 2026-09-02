# MRPG Realms Browser Testing

## Runtime

Start the managed local stack:

```bash
./start.sh
curl -sS http://127.0.0.1:9402/health
```

Open `http://127.0.0.1:9401/` in a browser. Stop it with `./stop.sh` when finished.

## Baseline acceptance

1. Enter a realm and confirm the HUD, crosshair, hotbar, terrain, and chest render.
2. Press Enter to open the bottom chat overlay, run `/help controls`, and confirm the controls help appears.
3. Run `/creative`, and confirm the status changes to creative/fly.
4. Hold `W` and confirm the position changes.
5. Use `Space` or `E` to fly upward and `Q` to fly downward.
6. Confirm `Ctrl+W` does not close the browser tab while creative mode is active.
7. Run `/survival`, confirm the status changes, and confirm Space jump still works.
8. Send ordinary text in chat and confirm it appears to another client in the same seed room, but not a client in another seed room.
9. Left-click a reachable block to mine it; right-click to place the selected block.
10. Mine a supporting block below/near the player and confirm the player falls/settles onto the next solid block rather than hovering or teleporting to the surface.
11. Dig into an underground space and confirm the player can remain below the highest terrain surface instead of being snapped upward.
12. With chat open, hold the visible voice button. Confirm microphone denial/provider unavailability is non-fatal and typed chat remains usable; ordinary transcripts auto-send without a review popup.
13. With chat closed, hold `T`, speak, and release. Confirm the transcript opens chat and auto-sends; pressing `T` while chat is open must not start capture.
14. In a second client in the same seed room, enable Incoming voice and Browser TTS settings. Send a voice message from the first client and confirm the second client receives the text and attempts local speech; the sender must not hear its own message repeated.
15. Use a browser without working native recognition or deny permission. Confirm the typed-chat fallback remains usable and no uncaught page errors appear.
16. Check the browser console for page exceptions. Expected result: zero uncaught errors.

## Automated project gates

```bash
npm run typecheck
npm test
npm run build
npm run dev
curl -sS http://127.0.0.1:9402/health
```

`npm test` currently covers deterministic world/noise contracts. Interactive mining, tunnel occupancy, and browser shortcut handling remain manual/browser acceptance until dedicated Playwright coverage is added.
