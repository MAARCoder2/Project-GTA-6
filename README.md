# PROJECT APEX: CITY RESPONSE
## Autonomous Browser-Based 3D Open-World Game Engineering & Stress-Test Benchmark

![Project Apex Title](.playwright-cli/r1-title-desktop.png)

**PROJECT APEX: CITY RESPONSE** is an original, realistic, browser-playable 3D open-world action game featuring third-person exploration, vehicle simulation, intelligent NPC behaviors, dynamic police pursuit, multi-stage missions, and WebGL city rendering.

---

## Key Features

- **3D Urban Open World**: A 240m x 240m interconnected district with 9 themed city blocks (Financial Skyscraper Plaza, Commercial Avenue, Metro Police Precinct, Residential Brownstones, Central Park, Grand Transit Station, Industrial Freight Depot, Skyline Construction, and Waterfront Boardwalk).
- **Third-Person Locomotion**: Responsive walking, sprinting, jumping, camera-relative movement, smooth rotation, and wall sliding collision.
- **Vehicle Simulation**: 3 distinct vehicle archetypes (`Apex GT-R`, `Metro Police Cruiser`, `Titan Tactical SUV`) with realistic acceleration, braking, speed-dependent steering decay, handbrake drifting, suspension height, collision impulses, and structural integrity gauges.
- **Contextual Vehicle Boarding**: Seamlessly enter and exit nearby vehicles with `[E]`, transitioning camera perspective and controls.
- **Pedestrian & AI Simulation**: Civilian NPCs strolling sidewalks, crossing streets, fleeing in panic from gunshots, or calling police as witnesses.
- **Police & Wanted Escalation**: 1 to 5 stars escalation. Police cruisers with functional dual-tone sirens and flashing red/blue lightbars intercept and pursue suspects. Escape line-of-sight for 14s to clear wanted stars.
- **Combat Simulation**: 3 weapons (Tactical 9mm Pistol, Apex Vector SMG, Breacher 12G Shotgun) with raycast hit detection, ammo magazines, reload animations, and audio transients.
- **3 Playable Missions**:
  1. *Courier Blitz*: High-priority multi-point parcel delivery against the clock.
  2. *Interception Protocol*: High-speed vehicle chase and tactical takedown of a rogue syndicate courier.
  3. *District Extraction*: Warehouse infiltration, neutralizing syndicate guards, retrieving tactical payload, and evading a 3-star high-heat police search.
- **Procedural Web Audio Engine**: Zero-asset-dependency sound synthesizer generating engine acceleration pitch curves, tire screech noise filters, gunshot transients, police siren dual-tone sweeps, and collision clangs.
- **Complete HUD & Radar**: Circular rotating minimap with live GPS blips, speedometer telemetry, health/armor meters, wanted stars, and action prompts.

---

## Local Setup & Run Instructions

### Prerequisites
- Node.js 18+ (Node 22 recommended)
- npm or bun

### 1. Installation
```bash
npm install
```

### 2. Development Server
```bash
npm run dev
```
The game will be available in your browser at `http://localhost:3000`.

### 3. Running Unit Tests
Execute the native Node test runner:
```bash
npm test # or node --test src/game/*.test.ts
```

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## Operative Controls

| Action | Keyboard / Mouse |
|---|---|
| **Move** | `W`, `A`, `S`, `D` or Arrow Keys |
| **Sprint** | Hold `SHIFT` |
| **Jump** | `SPACE` |
| **Aim Weapon** | Hold `RIGHT CLICK` |
| **Fire Weapon** | `LEFT CLICK` |
| **Reload** | `R` |
| **Select Weapon** | `1` (Pistol), `2` (SMG), `3` (Shotgun) |
| **Enter / Exit Vehicle** | `E` (near vehicle) |
| **Throttle / Reverse** | `W` (Accelerate), `S` (Brake / Reverse) |
| **Steer Vehicle** | `A` (Left), `D` (Right) |
| **Handbrake Drift** | `SPACE` |
| **Pause / Menu** | `P` or `ESC` |

---

## Architectural Highlights

- **Pure Physics Engine (`src/game/physics.ts`)**: Decoupled vector mathematics, AABB slab raycasting, swept sphere collision resolution, and vehicle impulse deflection with 100% test coverage.
- **Deterministic Rules (`src/game/rules.ts`)**: Pure state transitions for wanted escalation, acoustic perception cones, and armor damage calculation.
- **Single Mount Architecture (`src/game/GameEngine.ts`)**: Mounts WebGL renderer and physics loop independently of React virtual DOM updates.
- **Headless Optimization**: Automatically scales down rendering complexity under headless test environments (`navigator.webdriver`).
