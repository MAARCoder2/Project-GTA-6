# Architectural & Design Decisions: PROJECT APEX

## ADR 001: WebGL Three.js Direct Engine Architecture
- **Decision**: Mount Three.js directly via a dedicated engine class mounted once in React `useEffect`, managing rendering, scene graph, and animation loops independently of React re-render cycles.
- **Rationale**: Keeps 60 FPS rendering and 60 Hz physics completely decoupled from React's virtual DOM reconciliation. React remains the presentation layer for HUD and UI overlays.

## ADR 002: Pure Deterministic Physics Module
- **Decision**: Build an explicit 3D rigid-body, swept-capsule, and raycast-wheel physics system in pure TypeScript rather than relying on heavy third-party WebAssembly builds that can fail in diverse browser/container environments.
- **Rationale**: 100% deterministic, immediate startup with zero asynchronous WASM compilation lag, fully testable in Node.js native `node:test` runner.

## ADR 003: Procedural Web Audio API Sound Generation
- **Decision**: Synthesize all game audio (engine rpm pitch shifts, tire screech white-noise filters, gunshot impulse transients, police siren dual-frequency LFOs, bullet impacts) using the Web Audio API.
- **Rationale**: Prevents broken audio files, network fetch latency, CORS errors, or missing audio asset dependencies. Delivers rich, zero-bandwidth, spatialized sound.

## ADR 004: Procedural Urban Materials & Asset Pipeline
- **Decision**: Generate high-fidelity procedural canvas textures for asphalt roads, road paint, sidewalk tiles, and skyscraper window grids at engine startup.
- **Rationale**: Guarantees crisp visual textures without megabytes of slow external downloads, ensuring instant boot, realistic visual identity, and predictable memory footprint.

## ADR 005: Headless Test Scaling Discipline
- **Decision**: Implement `detectHeadless()` to automatically disable expensive post-processing, reduce shadow map overhead, and cap canvas rendering work when running under headless Playwright test runners.
- **Rationale**: Prevents software-rasterizer timeouts during browser automated test runs and ensures rock-solid automated verification.
