# Task Ledger: PROJECT APEX

| ID | Task | Owner | Status | Verification Criteria |
|---|---|---|---|---|
| T-001 | Environment audit & dependency setup | Lead Architect | COMPLETE | packages installed, `ENVIRONMENT_REPORT.md` written |
| T-002 | Type definitions & contracts (`types.ts`) | Gameplay Programmer | COMPLETE | Strict types for all entities, vehicles, missions, HUD |
| T-003 | Physics & collision engine (`physics.ts`) | Physics Engineer | IN_PROGRESS | AABB, swept collision, vehicle dynamics, 100% unit tests pass |
| T-004 | Rules, crime & combat logic (`rules.ts`) | AI & Systems Engineer | IN_PROGRESS | Perception, wanted levels, weapon math, unit tests pass |
| T-005 | Procedural audio engine (`audio.ts`) | Audio Engineer | IN_PROGRESS | Web Audio synthesis for engine, sirens, guns, screech |
| T-006 | 3D City District generator (`world.ts`) | Graphics Engineer | IN_PROGRESS | Multi-block city with roads, sidewalks, buildings, props |
| T-007 | Player Controller & camera (`PlayerController.ts`)| Gameplay Programmer | IN_PROGRESS | 3rd person camera, walk/sprint/jump, enter/exit vehicle |
| T-008 | Vehicle simulation (`VehicleManager.ts`) | Physics Engineer | IN_PROGRESS | 3 vehicle types, driving physics, collision, damage model |
| T-009 | Pedestrian & NPC AI (`NPCManager.ts`) | AI Engineer | IN_PROGRESS | State machines, walk paths, flee on gunshots, call police |
| T-010 | Wanted level & police pursuit (`PoliceSystem.ts`)| AI Engineer | IN_PROGRESS | 1-5 stars, line of sight search, pursuit cruisers |
| T-011 | Mission architecture (`MissionSystem.ts`) | Gameplay Programmer | IN_PROGRESS | 3 full missions, objectives, beacons, rewards |
| T-012 | Save/load system (`save.ts`) | Systems Engineer | IN_PROGRESS | LocalStorage persistence, versioned migration |
| T-013 | UI & HUD (`HUD.tsx`, menus, radar) | UI/UX Designer | IN_PROGRESS | Radar minimap, speedometer, wanted stars, menus |
| T-014 | Automated unit test suite (`*.test.ts`) | Test Engineer | PENDING | `node --test` passes all suites |
| T-015 | Visual & Playwright verification | Test Engineer | PENDING | First paint screenshot, mobile check, gameplay capture |
