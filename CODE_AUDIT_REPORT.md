# PROJECT-GTA-6 — Code Audit Report
**Repository:** https://github.com/MAARCoder2/Project-GTA-6  
**Branch reviewed:** main  
**Audit date:** 2026-10-20  
**Scope:** Source-code review through GitHub connector; no local build or live browser session was executed during this audit.

## Executive Summary
The reported blocky visual style has a confirmed source-code cause: the player and NPCs are assembled from rectangular Three.js primitives, vehicles are assembled mainly from box meshes, and much of the city is procedural box geometry with generated window textures. The 2D UI overlay is an intentional web HUD, not evidence that the renderer is 2D. However, it can contribute to the overall "web demo" feel when the underlying 3D assets and scene detail are low-fidelity.

The project does contain a real Three.js/WebGL scene and a custom TypeScript simulation. It is not a true AAA character/vehicle asset pipeline or a full rigid-body physics engine. The core issue is therefore architectural fidelity and simulation accuracy, not merely a theme or CSS issue.

## Confirmed Findings

### P0 — Blocky procedural player/NPC models
**Files:** `src/game/entities/PlayerController.ts`, `src/game/entities/NPCManager.ts`  
Player torso, head, arms, legs, boots, and gun are built using `THREE.BoxGeometry`. NPCs use the same pattern. The NPC manager provides outfit color variation, but no external rigged model, skeletal mesh, skinning, or animation mixer appears in these implementations.
**Effect:** square heads, rectangular torsos and limbs, rigid silhouette, limited face/clothing detail and non-natural deformation.
**Recommended fix:** replace the player and civilian/hostile NPC appearance layer with original, license-cleared rigged GLB/GLTF models. Use compatible walk/run/aim/hit/fall animations with a skeleton/animation mixer. Keep gameplay positions, state machines and collision capsules independent of render mesh. Add an asset manifest and graceful fallback only if the model fails to load.

### P0 — Vehicle silhouettes are composed from boxes
**File:** `src/game/entities/VehicleManager.ts`
Chassis, cabin, roof, door panels, lights and siren lenses are predominantly box geometry. Wheels are cylinders with relatively low-detail rims. There are no production vehicle meshes/GLB assets in the tracked source tree; the only raster files are AI Studio temporary media/screenshots.
**Effect:** toy-like or blocky car proportions, flat body panels, missing wheel arches, windshields, mirrors, bumpers, grille, door seam and other silhouette-defining parts.
**Recommended fix:** replace visible render models with original or properly licensed optimized GLB vehicles. Build separate collision proxies and preserve current vehicle state/physics API. Include texture/material detail, wheel pivots, glass, lights and a few LODs where practical.

### P1 — City architecture relies heavily on box meshes and generated textures
**File:** `src/game/world.ts`
Road surfaces and sidewalks are planes/boxes, while major skyscrapers, commercial/residential buildings, warehouse, construction-site elements and other structures use box geometry. Windows are painted into canvas textures; asphalt grain is generated procedurally.
**Effect:** building silhouettes feel like blocks, façades are texture grids rather than modeled windows/architectural features, and the city lacks variation in roofline, storefronts, balconies, setbacks, props and material weathering.
**Recommended fix:** first redesign 3–5 hero building modules with modeled facade depth, window recesses, rooflines, trims, signage and PBR materials. Add a small reusable library of optimized facades and varied building silhouettes. Use baked detail and instancing to retain browser performance. Avoid replacing every building with an expensive high-poly mesh.

### P1 — UI is a DOM/CSS overlay, and title/pause screens obscure the 3D scene
**Files:** `src/game/ui/HUD.tsx`, `TitleScreen.tsx`, `PauseMenu.tsx`, `MissionSelectModal.tsx`
The HUD and menus use HTML/CSS/Tailwind elements placed over the canvas. The title screen has a largely opaque radial-gradient backdrop; pause/settings/mission menus use opaque or heavily blurred dark overlays.
**Effect:** HUD elements naturally look 2D and title/pause states cover the world. In-game HUD is a conventional flat overlay; this is not inherently a bug, but the current visual language may look like a dashboard instead of a shipped game.
**Recommended fix:** retain accessible DOM UI for health/ammo/minimap/readability, but simplify and standardize it as a game HUD. Use transparent restrained overlays, more deliberate hierarchy, consistent typography, subtle animation and accurate state. Use in-world 3D diegetic UI only where helpful (e.g. mission markers); do not make all HUD text 3D merely to avoid flatness.

### P1 — Combat hit checks can select targets without actual obstacle-aware ray intersection
**File:** `src/game/GameEngine.ts`, `src/game/entities/PlayerController.ts`
The player returns an aim point 35 units along camera direction. The engine then compares direction-dot thresholds against NPC and vehicle center positions. The reviewed target-selection code does not perform a nearest-hit raycast against target hitboxes and intervening world geometry at that point.
**Effect:** shots may hit a target through walls, hit based on center-direction approximation, or behave differently from the visible reticle. Shotgun pellet spread is defined in weapon data but the reviewed application-level hit loop selects a single target per fired event.
**Recommended fix:** use a normalized camera/reticle ray and actual ordered ray intersections against world blockers and target hitboxes; choose the nearest valid collision only. Implement weapon spread/pellets deliberately. Add tests for wall obstruction, target priority, range and edge-of-hitbox cases.

### P1 — Gunshot perception origin appears incorrect
**File:** `src/game/GameEngine.ts`
The engine calls `npcManager.notifyGunshot(this.player.position, this.player.position)` rather than passing a muzzle/shot origin. That makes the sound origin the player's world position, not the weapon muzzle or actual projectile impact.
**Effect:** acoustic perception and witness logic can be spatially inaccurate. The call's second position is also identical to the first; inspect the method contract to make its intended semantics clear.
**Recommended fix:** pass the true weapon muzzle position (or projectile origin) and define whether witness detection is based on sound, line-of-sight, or impact. Track the sound event independently from the crime event.

### P1 — Collision function described as swept but implements overlap correction at a single position
**File:** `src/game/physics.ts`, `resolveSphereAABBCollision`
The function calculates the closest point from a supplied position to an AABB and corrects current overlap. It does not accept previous position, velocity, or a sweep segment, so it is not a swept collision test despite the comment/name context.
**Effect:** fast-moving characters/NPCs may tunnel through thin geometry; collision can be unreliable under high movement speeds or spikes. Calling the tests "swept sphere collision" overstates the current coverage.
**Recommended fix:** implement true swept sphere/capsule collision or use a compatible browser physics engine; add high-speed wall, corner, initial-penetration and timestep-spike tests.

### P1 — Vehicle collision proxy is crude
**File:** `src/game/entities/VehicleManager.ts`
Vehicle/world collision uses a sphere radius derived from width against static AABBs; vehicle-to-vehicle collision uses center distance and a length-based minimum distance, not oriented body shapes.
**Effect:** cars may collide too early/late, rotate through obstacles, look disconnected from contact points or respond unnaturally at corners.
**Recommended fix:** use oriented box/capsule or physics-engine colliders matching vehicle bounds; calculate collision normal and impulse at the contact approximation. Keep visible mesh separate from collider. Test frontal, side, corner and vehicle-to-vehicle impacts.

### P1 — Police pursuit uses direct steering and manual movement
**File:** `src/game/entities/PoliceSystem.ts`
Police vehicles rotate toward the player or last known position and position is integrated directly in the police system. The reviewed logic does not use a true road-path planner or obstacle-aware navigation for pursuit.
**Effect:** patrol cars can steer into buildings or cut across the road grid, making pursuit look artificial even if wanted-level rules work.
**Recommended fix:** route police through road-waypoint graph, use pathfinding/steering with collision checks, preserve last-known-position search state and add stuck recovery. Ensure a police vehicle has one movement authority rather than multiple updates.

### P1 — NPC waypoint selection can yield unrealistic movement
**File:** `src/game/entities/NPCManager.ts`
NPCs choose random sidewalk waypoints and move directly toward them. Although AABB overlap correction exists, no graph-route pathfinding is apparent in the reviewed update method.
**Effect:** pedestrians can cut diagonally across sidewalks/roads, get stuck on corners, or jitter while trying to reach blocked targets.
**Recommended fix:** use connected sidewalk paths, local obstacle avoidance and stuck timers. Add deterministic test maps that verify NPCs reach targets without intersecting obstacles.

### P2 — Animation is procedural limb rotation, not character animation
**Files:** `PlayerController.ts`, `NPCManager.ts`
Player and NPC arms/legs are rotated using sine-wave cycles. NPC down state tips the entire mesh group by 90 degrees.
**Effect:** stiff robotic gait, no body weight shift, no foot planting, no natural turn/aim/hit transitions, and simplistic fall response.
**Recommended fix:** use rigged animation clips and a state-driven animation controller; optionally blend procedural aim/head-look over authored animation. Keep any ragdoll claim conditional on actual skeleton/physics integration.

### P2 — Potential rendering/configuration issue: quality settings are only partially applied
**File:** `src/game/GameEngine.ts`, settings UI.
LOW disables shadows; other presets enable shadows. The source sets pixel ratio at startup, but the reviewed quality-switch method does not fully rebuild renderer settings or adjust texture/geometry/AI budgets. Also, `onResize` updates renderer size but the pixel ratio is only configured in the constructor.
**Effect:** the quality selector may not produce meaningfully distinct quality tiers; high-DPI changes are not fully handled.
**Recommended fix:** centralize an explicit quality configuration (pixel ratio, shadow resolution, effects, draw/AI budgets) and apply it whenever settings change or the viewport changes.

### P2 — Event listener and resource cleanup is incomplete
**File:** `src/game/GameEngine.ts`
Listeners are attached using anonymous callbacks in `setupInputs` and `dispose()` removes only resize; renderer is disposed, but registered keyboard/mouse/context-menu listeners are not removed. Texture/material/geometry disposal also needs auditing for entity removal/restart.
**Effect:** repeated mount/unmount or restart flows can leave listeners, duplicate actions, or leak GPU resources.
**Recommended fix:** retain callback references and unregister all listeners; dispose owned geometries, materials, textures, lights and audio resources when removing systems/entities. Add mount-dispose-remount testing.

### P2 — FPS reporting is an instantaneous reciprocal
**File:** `src/game/GameEngine.ts`
`fps = Math.round(1 / frameTime)` reflects a single frame interval, not a smoothed average or percentile distribution.
**Effect:** FPS counter can jump wildly and does not constitute a robust performance benchmark.
**Recommended fix:** collect frame-time samples over a fixed window and report median/average plus p95 frame time, test duration and scenario.

## Architecture / Asset Pipeline Findings
- The project uses Three.js and a real WebGL canvas: it is 3D in rendering architecture.
- No production GLB/GLTF/FBX model asset files were found in the tracked tree; the repository mainly contains TypeScript source, docs and temporary PNG artifacts.
- Player/NPC and car models are coded from primitive geometries.
- City buildings mainly use box meshes and procedural canvas textures.
- Physics and collision are custom TypeScript approximations rather than a general-purpose rigid-body physics engine.
- The UI being 2D is expected in a browser; the problem is the overall art fidelity and presentation, not that DOM overlays are inherently incorrect.

## Documentation / Test Evidence Mismatch
- `TEST_RESULTS.md` claims 15 unit test cases across physics, rules and save logic. The tracked source currently contains those three test files: 6 physics cases, 6 rule cases and 3 save cases.
- `TEST_PLAN.md` describes a `missions.test.ts` suite, but no such file is present in the tracked recursive tree. Mission logic therefore lacks the planned dedicated unit tests in the current repository.
- `TEST_RESULTS.md` and `PERFORMANCE_REPORT.md` claim browser screenshots and FPS verification, but the tracked README's screenshot paths point to `.playwright-cli/...`, and these screenshots were not found in the recursive repository tree. The performance table mixes measured headless FPS ranges with desktop target values and marks scenarios VERIFIED without sufficiently detailed reproducible hardware/session evidence.
- The current audit did not execute `npm run build`, `npm test`, or a live browser session. Therefore this report does not independently confirm the stated PASS/VERIFIED claims.
- The repository tree contains six PNG artifacts under a temporary AI Studio media path, but no tracked character/vehicle model assets.

## Prioritized Remediation Plan

### Phase 1 — Replace the visual primitives
1. Add a model loader and asset manifest (GLB/GLTF).
2. Replace player mesh with an original rigged humanoid and working animations.
3. Replace NPC box models with 2–3 rig-compatible character variants.
4. Replace vehicle box assemblies with 2–3 optimized, license-cleared vehicle meshes and wheel pivots.
5. Upgrade a few hero city buildings, then generalize the asset kit.
6. Preserve gameplay state/colliders while swapping render meshes.

### Phase 2 — Fix simulation correctness
1. Replace cone/dot target hit approximation with obstacle-aware nearest ray intersection.
2. Correct gunshot origin and witness/perception semantics.
3. Implement true swept collision or a proper physics engine.
4. Improve vehicle collision shapes and contact response.
5. Route pedestrians and police through connected navigation graphs.
6. Add mission-system tests and integration tests for crime → witness → dispatch → pursuit → escape.

### Phase 3 — Polish and benchmark
1. Establish visual material/lighting standards and distinct day/night or scene lighting only if implemented coherently.
2. Improve HUD hierarchy and make title/pause overlays intentional rather than trying to make all UI 3D.
3. Apply quality presets consistently.
4. Fix listener/resource disposal.
5. Replace instantaneous FPS with windowed frame-time telemetry.
6. Re-run and publish reproducible build, test, screenshots and benchmark evidence.

## Recommended Acceptance Gates
- No default player/NPC appearance assembled from rectangular body parts.
- At least one playable character with a compatible rig and locomotion/aim/hit animations.
- At least two convincing vehicle silhouettes with matching collision proxies.
- Bullets cannot damage entities through a blocking world collider.
- Witnesses react according to actual distance/visibility/audio rules.
- Police follow roads, collide with the world, and recover from stuck states.
- NPCs navigate via walkable routes and avoid persistent deadlocks.
- Build and unit tests run on the exported project.
- Browser test captures exist as committed artifacts or linked CI artifacts.
- Frame-time reports include actual test hardware and scenario metadata.
- Every VERIFIED claim in project docs links to evidence.

## Audit Conclusion
The blocky visual result is directly explained by the model-construction code. More CSS polish or stronger lighting alone will not solve it. The biggest improvement comes from replacing primitive character and vehicle render meshes with optimized original rigged assets, improving the architectural asset kit, and then fixing the simulation defects identified above.

This report is based on source inspection only; browser behavior and performance still require independent execution.
