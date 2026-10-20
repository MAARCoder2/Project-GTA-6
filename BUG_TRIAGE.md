# BUG TRIAGE & REMEDIATION MATRIX: PROJECT APEX / PROJECT-GTA-6
**Audit Date:** October 20, 2026  
**Auditor:** Principal Systems Architect & Lead Gameplay Programmer  
**Mission:** Targeted Repair, Hardening & Verification of Existing Repository

---

## 1. Prioritized Defect Ledger

| Bug ID | Priority | System | Root Cause Analysis | Remediation Strategy | Affected Files |
|---|---|---|---|---|---|
| **BUG-P0-01** | **P0** | Player Controls & Basis | Handedness mismatch in camera-relative right basis (`rightX = forwardZ, rightZ = -forwardX`). When looking in +Z, this points to screen LEFT, reversing A and D keys. | Derive mathematically sound camera forward/right basis (`rightX = -forwardZ, rightZ = forwardX`). Ensure consistent basis across walk, aim, and vehicle steering. Normalize diagonal input. | `PlayerController.ts`, `GameEngine.ts`, `physics.ts` |
| **BUG-P0-02** | **P0** | Combat & Hit Detection | Bullets used a simple directional dot-product threshold against NPC center with zero obstacle obstruction checks. Shots penetrate buildings; multiple targets aren't distance-sorted. | Implement true 3D raycast hit query with world collision box obstruction tests, target hitbox bounding checks, and nearest-valid-hit selection. | `GameEngine.ts`, `physics.ts`, `PlayerController.ts` |
| **BUG-P0-03** | **P0** | Aiming & Firing Pose | Arm rotations during aiming were overridden or poorly blended with walk animations; muzzle origin was misaligned; no visible weapon recoil kick. | Correct arm pivot and aiming orientation to point directly along camera reticle pitch/yaw. Add firing kick recoil animation and lifetime-driven muzzle flash. | `PlayerController.ts` |
| **BUG-P0-04** | **P0** | Vehicle Entry/Exit & Safety | `exitVehicle` spawned player at fixed left offset without testing wall collision. Vehicle interaction prompt was shown even when no vehicle was nearby. | Test exit candidate positions (driver side, passenger side, rear) against collision hulls. Update HUD prompt only when an enterable vehicle is within valid range. | `PlayerController.ts`, `HUD.tsx` |
| **BUG-P0-05** | **P0** | Vehicle Motion & Collision | Dual integration: `PoliceSystem` updated cruiser positions independently of `VehicleManager`. Single center sphere collision allowed vehicle nose/tail to pass through walls. | Centralize vehicle motion into authoritative update. Implement multi-sphere capsule/box collision coverage (front, center, rear) along vehicle heading. | `VehicleManager.ts`, `PoliceSystem.ts`, `physics.ts` |
| **BUG-P1-01** | **P1** | NPC Identity & Archetypes | NPCs were identical box figures with only shirt color altered. Incapacitated NPCs had jarring sudden rotation. | Create 4 distinct visual archetypes (Business, Casual/Hoodie, Police, Syndicate) with modeled hair, caps, and vests. Coherent fall poses. | `NPCManager.ts` |
| **BUG-P1-02** | **P1** | Police Pursuit & Last Known Pos | Police cruisers occasionally lost navigation or tracked omnisciently. | Enforce line-of-sight checks, navigate via road waypoints, pursue last known position when lost, and decay wanted level reliably. | `PoliceSystem.ts`, `rules.ts` |
| **BUG-P1-03** | **P1** | Mission Flow & Duplication | Mission restart could leave orphaned enemy instances or listeners. | Add clean lifecycle resets in `MissionSystem.ts` and add dedicated mission unit tests. | `MissionSystem.ts`, `missions.test.ts` |
| **BUG-P2-01** | **P2** | Visual Presentation & Lighting | Excessively bright/flashy UI accents and flat character shading. | Refine typography, restrain UI glow, and balance street-level ambient and fill lighting. | `HUD.tsx`, `GameEngine.ts`, `index.css` |

---

## 2. Workstream Allocation & Sequencing

1. **Step 1 (Workstream B - Controls)**: Fix coordinate basis, diagonal normalization, and camera right/forward consistency. Add unit tests in `controls.test.ts`.
2. **Step 2 (Workstream C - Combat)**: Implement obstructed raycast hit-testing, nearest-hit resolution, muzzle origin, and weapon recoil kick. Add unit tests in `combat.test.ts`.
3. **Step 3 (Workstream D - Vehicles)**: Multi-point vehicle collision, safe multi-point exit placement, and single authoritative integration in `VehicleManager`. Add unit tests in `vehicle.test.ts`.
4. **Step 4 (Workstream E - NPCs, Police & Missions)**: Fix sound origin parameter bug, add stuck recovery, enhance visual silhouettes, and verify mission reset without duplicates. Add unit tests in `missions.test.ts`.
5. **Step 5 (Workstream F & G - Visual Polish & Review)**: Restrain HUD flashiness, verify all unit tests pass, compile, restart dev server, and run Playwright verification with browser screenshots.
