# Test Plan: PROJECT APEX: CITY RESPONSE

## 1. Test Strategy Overview
Project Apex combines unit tests for deterministic mathematics, integration tests for rule systems, and end-to-end automated browser verification via `playwright-cli`.

## 2. Unit Testing Suite (`node:test`)
- **Physics Suite (`physics.test.ts`)**:
  - AABB overlap checks & raycast bounding box intersection
  - Swept sphere / capsule movement collision with wall sliding
  - Ground elevation snapping and ramp slope detection
  - Vehicle longitudinal acceleration, top speed limiter, and reverse forces
  - Vehicle steering angle decay at high speed
  - Vehicle collision impulse calculation and health reduction
- **Rules Suite (`rules.test.ts`)**:
  - Distance and line-of-sight checks
  - Gunshot acoustic perception radius (audible to NPCs within 40m)
  - Wanted escalation from crime types (reckless driving, assault, firearm discharge, officer down)
  - Wanted evasion countdown and decay when lost-sight is maintained
  - Weapon damage calculations, range falloff, and headshot multipliers
- **Missions Suite (`missions.test.ts`)**:
  - Mission 1 "Courier Blitz" parcel collection progression and timer expiry
  - Mission 2 "Interception Protocol" target vehicle ramming & health threshold
  - Mission 3 "District Extraction" phase progression (infiltrate -> eliminate -> package -> escape)
- **Save Suite (`save.test.ts`)**:
  - Serialization, versioning, default fallback on corrupted JSON data

## 3. Playwright Automated Verification
- **Scenario A: First Paint & UI Mount**: Verify canvas initialization, WebGL context, Title Screen UI rendering at 1440x900.
- **Scenario B: Quick Start & Locomotion**: Autostart into game, check HUD visibility, simulate keyboard movement input.
- **Scenario C: Vehicle Entry & Driving**: Move towards vehicle, trigger enter action, verify vehicle HUD / speedometer changes.
- **Scenario D: Combat & Weaponry**: Aim, fire weapon, verify ammo decrement and muzzle flash event.
- **Scenario E: Mobile Viewport Resilience**: Resize to 390x844, verify responsive controls and UI overlay.
