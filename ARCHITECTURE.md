# System Architecture: PROJECT APEX: CITY RESPONSE

```
+-----------------------------------------------------------------------------------+
|                                 REACT SHELL (DOM)                                 |
|  [TitleScreen]  [HUD]  [PauseMenu]  [SettingsModal]  [ControlsModal]  [EventFeed] |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                GAME ENGINE CORE                                   |
|  - Fixed Timestep Physics Loop (60 Hz)                                            |
|  - Render Interpolation & Variable Frame Pacing (requestAnimationFrame)           |
|  - Input Manager (Keyboard, Mouse PointerLock, Gamepad-ready)                      |
|  - Web Audio Synthesizer (Zero-latency procedural sound fx)                       |
+-----------------------------------------------------------------------------------+
     |                     |                     |                     |
     v                     v                     v                     v
+-----------+       +-------------+       +-------------+       +---------------+
|  PHYSICS  |       |   ENTITIES  |       |   SYSTEMS   |       |   RENDERER    |
| - AABB /  |       | - Player    |       | - Police &  |       | - Three.js    |
|   Swept   |       | - Vehicles  |       |   Wanted    |       | - City World  |
| - Ground  |       | - NPCs      |       | - Missions  |       | - Dynamic Sky |
| - Vehicle |       | - Bullets   |       | - Crime Bus |       | - Particles   |
|   Physics |       | - Props     |       | - Save/Load |       | - Minimap FBO |
+-----------+       +-------------+       +-------------+       +---------------+
```

## Module Separation & Responsibilities

1. **`src/game/physics.ts`**: Pure functions for bounding box intersections, raycast line tests, ground elevation clamping, vehicle longitudinal and lateral force models. Zero DOM or React dependencies, fully testable in `node:test`.
2. **`src/game/rules.ts`**: Crime escalation matrix, line-of-sight & acoustic perception math, weapon damage calculations, mission goal validations. Pure logic, fully testable in `node:test`.
3. **`src/game/audio.ts`**: Web Audio synthesizer creating realistic sound events without external asset fetching.
4. **`src/game/world.ts`**: City district geometry generation (roads, sidewalks, crosswalks, buildings, landmarks, vegetation, streetlights, collision hulls).
5. **`src/game/entities/`**:
   - `PlayerController.ts`: Movement, camera control, vehicle enter/exit, weapon firing.
   - `VehicleManager.ts`: Vehicle instances, physics simulation, tire rotation, steering, headlights, siren lights.
   - `NPCManager.ts`: Pedestrian population, state machines, flee reactions, witness logic.
   - `PoliceSystem.ts`: Police vehicles, pursuit AI, search grid, escalation levels.
6. **`src/game/missions/`**:
   - `MissionSystem.ts`: Lifecycle of Courier Blitz, Interception Protocol, and District Extraction.
7. **`src/game/ui/`**:
   - React components overlaying the WebGL canvas, responding to engine state updates throttled to avoid unneeded re-renders.
