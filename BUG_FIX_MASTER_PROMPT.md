# PROJECT-GTA-6 — Gameplay Bug-Fix & Verification Master Prompt

## Mission

You are repairing the existing repository **MAARCoder2/Project-GTA-6**. The current game has serious gameplay defects: reversed left/right movement, unreliable aiming and shooting, NPCs not taking hits, missing/incorrect firing poses and animation, unreliable vehicle entry, vehicles clipping or jumping through one another/world geometry, inconsistent NPC/police behavior, and a low-quality, flashy visual presentation.

**This is a targeted repair and hardening task, NOT a full rewrite.**

Preserve the existing React + TypeScript + Three.js architecture and current gameplay content wherever practical. First identify root causes, then make small, testable changes. Do not replace working systems just because a different architecture is fashionable. Avoid deleting features, resetting the repository, changing the whole stack, or creating a new game alongside the old one.

The goal is a reliably playable browser game with controls, combat, vehicles, NPCs, and missions that actually work—and an honest evidence-based report.

---

## 1. Environment, Repository and Change-Safety Gate

Before editing:

1. Inspect the current repository state and the latest branch/commit. Do not assume an earlier audit still matches the current code.
2. Read at minimum:
   - `README.md`
   - `ARCHITECTURE.md`
   - `REQUIREMENTS.md`
   - `BUGS.md`
   - `TEST_PLAN.md`
   - `TEST_RESULTS.md`
   - `PROJECT_STATUS.md`
   - `package.json`
   - `src/game/GameEngine.ts`
   - `src/game/physics.ts`
   - `src/game/rules.ts`
   - `src/game/entities/PlayerController.ts`
   - `src/game/entities/NPCManager.ts`
   - `src/game/entities/VehicleManager.ts`
   - `src/game/entities/PoliceSystem.ts`
   - `src/game/missions/MissionSystem.ts`
   - relevant HUD/UI files and all existing tests.
3. Identify which real capabilities are available: terminal, build/test execution, browser automation, screenshot capture, visual inspection, asset import, and genuine agent delegation. Do not pretend a tool was used if it was not available.
4. Preserve current work. If git/branch commands are actually available, create a dedicated fix branch such as `fix/gameplay-regressions` and capture the starting commit. If not, state the limitation and continue safely.
5. Create or update a concise `BUG_TRIAGE.md` before making broad changes. Keep existing documents consistent instead of producing contradictory duplicate reports.

**Do not stop after writing the plan.** Once the root causes and interfaces are understood, implement the fixes and test them.

---

## 2. Agent/Workstream Orchestration

Use actual independent agents only if the current environment genuinely supports delegation. If it does, assign bounded tasks, shared interface contracts, file ownership, acceptance criteria, and explicit handoff artifacts. Do not allow multiple agents to overwrite the same files without coordination.

If real multi-agent execution is unavailable, run the same workstreams as separate sequential specialist passes, maintaining the same deliverables. Do not claim that simulated roles were separate agents.

### Workstream A — Lead Architect / Bug Triage
- Reproduce or create a deterministic reproduction for each reported defect.
- Trace input → player/controller state → world simulation → render transform → HUD.
- Assign bug IDs, severity, root cause, impacted files, and test coverage.
- Define minimal interfaces and file ownership before implementation.
- Prevent scope creep and protect existing features.

### Workstream B — Input, Camera and Player Controller
- Trace coordinate handedness and the forward/right basis through player movement, camera-relative input, player facing, camera orbit, aiming, and vehicle steering.
- Repair direction inversion at the source, not by adding scattered negative signs.
- Normalize diagonal movement and make movement consistent at different camera yaw angles.
- Ensure input state is cleared on key-up, pointer loss, blur, pause, and resume as appropriate.
- Verify input handlers and animation updates are registered only once.

### Workstream C — Combat, Aim and Damage
- Own the aim ray, hit selection, obstruction tests, ammo/fire timing, firing animation, muzzle feedback, and damage event flow.
- Use actual target hitboxes or ordered ray intersections rather than direction-dot approximations alone.
- Prove bullets cannot damage an NPC or vehicle through a blocking world object.
- Keep hit detection separate from visual meshes so a character model replacement does not break combat.

### Workstream D — Vehicle Entry, Driving and Collision
- Own proximity detection, enter/exit state, driver ownership, player/vehicle transforms, steering, acceleration/braking, collision, wheel transforms and recovery.
- Establish one authoritative place that integrates each vehicle’s motion exactly once per simulation tick.
- Prevent separate systems from moving the same vehicle independently.
- Make collision shapes agree with visible vehicle dimensions as closely as practical.
- Add recovery from trapped, overturned or invalid vehicle states where feasible.

### Workstream E — NPC, Police, Missions and World Rules
- Check NPC perception, witness logic, damage/incapacitation states, navigation, police perception/pursuit, and mission transitions.
- NPC reactions must follow actual events, distance, visibility or sound rules—not accidental global triggers.
- Police should follow road navigation where possible and must not know the player’s exact position without valid perception or a documented last-known-position rule.
- Ensure each mission transition has an explicit condition and safe restart/failure behavior.

### Workstream F — Visual/Animation/UX Repair
- Improve individual character identity, silhouette, proportions, clothing and material differentiation.
- Prioritize actual 3D character/vehicle models and rigged animation when a compatible, license-cleared asset pipeline is available.
- Do not replace 3D models with 2D cutout images/billboards just to make screenshots look better.
- Reduce unnecessary neon effects, over-animated HUD elements, and competing color accents. Keep the interface readable and intentionally game-like.
- Do not claim a rig, animation clip, ragdoll, or high-quality model exists unless it is in the project and has been verified.
- Avoid making large visual/asset changes until critical control and gameplay regressions are fixed.

### Workstream G — Independent Adversarial Reviewer
The reviewer must initially inspect the changes and evidence as a skeptical reviewer, not simply agree with the implementation agent.

Reviewer duties:
- Re-check root-cause claims against code.
- Look for wrong signs, stale state, duplicate update loops, invalid transforms, collisions that ignore blockers, race conditions, event leaks and broken state transitions.
- Attempt to disprove the claimed fixes through counterexamples and edge cases.
- Report blocking and high-severity bugs with reproduction steps.
- Require additional fixes and reruns when evidence is insufficient.
- Approve a fix only when the acceptance criteria and required tests pass.

### Integrator / Release Owner
Integrate workstreams in this order: critical controls, aiming/hit detection, vehicle interactions/collision, NPC/police state flow, then visual polish and cleanup. Resolve conflicts before running final verification.

---

## 3. Required Workflow for Every Bug

For every bug, execute this lifecycle:

1. **Reproduce:** specify exact setup and inputs. If runtime reproduction is unavailable, label it UNREPRODUCED and use a focused unit/integration test plus code trace.
2. **Trace:** follow the full data/control flow and inspect all callers. Find the root cause, not just the visible symptom.
3. **Plan:** define the smallest safe correction and affected modules.
4. **Implement:** make the correction in the existing project.
5. **Test:** add a regression test that failed before the fix where practical.
6. **Review:** have the independent reviewer inspect the change and test.
7. **Retest:** rerun affected tests and relevant end-to-end journeys after integration.
8. **Document:** mark the result VERIFIED only when the described test was actually executed and passed. Otherwise use PARTIALLY VERIFIED, UNVERIFIED, BLOCKED, or FAILED.

Do not claim a bug is fixed just because the code compiles. Do not delete or weaken failing tests to produce a green result.

---

## 4. Priority P0 — Controls Must Match Player Intent

### Reported symptom
Pressing right moves the player left; pressing left moves the player right.

### Required investigation and repair
- Establish and document the project’s world-forward axis, character-forward axis, camera-forward basis, and sign convention.
- Inspect camera-relative forward/right vectors and all yaw calculations.
- Prefer deriving camera forward/right from the camera orientation or a single mathematically correct helper rather than maintaining duplicated coordinate formulas.
- Verify the same convention for keyboard movement, player-facing direction, aiming, vehicle controls, and camera.
- If the player faces local +Z while the camera looks along the opposite convention, explicitly account for that handedness.
- Do not blindly invert only one key handler; the resulting movement, orientation and aim must remain consistent.
- Normalize diagonal input so W+D is not faster than W.
- Avoid repeated jump-triggering when Space is held unless that is a deliberate, tested design.

### Acceptance tests
At camera yaw 0, +90°, -90°, and after rotating the camera:
- W moves in the visually intended forward direction.
- S moves backward.
- A consistently moves left relative to the current camera/player convention.
- D consistently moves right.
- Releasing a key stops input; no movement remains stuck after focus changes.
- Diagonal speed remains within the configured speed cap.
- Player facing and animation direction match movement.
- Vehicle left/right input also matches the visible direction of steering.

Capture browser evidence when real browser automation is available.

---

## 5. Priority P0 — Aiming, Shooting, Impact and Damage Must Work Together

### Reported symptoms
- Arms do not lift correctly when aiming.
- No clear firing animation is visible.
- Ammo/case-like feedback appears, but NPCs do not take a hit.
- The reticle and actual hit result may disagree.

### Required investigation and repair
Trace the full path from right-click aim and left-click fire through `PlayerController`, `GameEngine`, NPC/vehicle hitboxes, damage, animation and HUD.

#### A. Aim pose
- Ensure the aiming input actually changes the player into an aim state.
- Verify arm group pivots, shoulder positions, weapon orientation and local forward axis.
- Ensure walk-cycle animation does not overwrite the aim pose.
- When a compatible rigged character is available, use a real aiming animation plus suitable upper-body blending.
- If a procedural fallback is retained, make the arm/weapon pose visibly point toward the aim direction.
- Confirm the weapon muzzle is aligned with the intended firing direction.

#### B. Correct hit testing
- Aim from the current camera/reticle ray using a real Three.js raycaster or an equally precise, documented collision-query implementation.
- Use actual NPC and vehicle hitboxes/collision proxies.
- Sort candidate hits by distance and accept only the nearest valid hit.
- Include world blockers in the query so walls and vehicles can obstruct shots.
- Avoid relying on a direction dot threshold against NPC center positions as the definitive hit test.
- Check weapon range, ammo, fire-rate cooldown, reload state and damageable state.
- Implement pellet spread for the shotgun or explicitly document the simplified behavior. Do not pretend one hit represents multiple pellets.
- Keep visible render meshes and gameplay hitboxes related, but independently maintainable.
- Correct all coordinate mismatches between camera direction, muzzle origin, target location and hit point.

#### C. Visible firing feedback
- On a successful firing event, produce an observable firing state: weapon recoil or kick, arm/upper-body response, a brief muzzle-flash mesh/sprite or particle, and compatible audio.
- Use a delta-time-driven effect lifetime, not a permanent light or frame-rate-dependent animation.
- The effect must be visible in normal gameplay and not only in a debug scene.
- Recoil must not permanently rotate the aim direction or corrupt the camera state.
- Ammo decreases exactly once per shot.
- Empty-ammo, reload and cooldown behavior must be internally consistent.

#### D. Damage and reaction
- A valid hit must call the target’s damage function exactly once for that impact.
- Health/state changes must be observable and reflected by appropriate feedback.
- Non-fatal hits should trigger an appropriate hit/flinch response; incapacitation should use a coherent fall/death-state animation rather than a sudden mesh rotation that intersects the floor.
- Do not use random headshot selection as a substitute for actual hit-location testing unless it is intentionally documented as a prototype approximation.
- A shot event’s sound origin must use the actual weapon/projectile origin. Do not pass the player position twice as separate arguments.
- Witnesses should react to the correct sound/visible event and must not report an unrelated crime merely because another NPC has an expired timer.

### Acceptance tests
1. Aim input visibly raises/positions arms and weapon.
2. Reticle direction and projectile/hit-query direction match.
3. Firing produces visible, short-lived muzzle feedback, recoil and audio.
4. Ammo decreases once and fire-rate limits hold.
5. A target in the ray path takes damage.
6. A target behind a blocking wall does not take damage.
7. Aiming just past a target misses; aiming within the hitbox registers consistently.
8. Range limits and reload behavior work.
9. A hit NPC changes state and displays a coherent reaction.
10. Shooting a vehicle only damages it when the valid hit query reaches its collision target.
11. Police/witness consequences are triggered according to the configured rules.
12. Tests cover all three weapon definitions or clearly state which weapon behavior remains unimplemented.

---

## 6. Priority P0 — Vehicle Entry, Exit and Transform Ownership

### Reported symptoms
- The player sometimes cannot enter a vehicle.
- Vehicles jump, clip, swap through each other, or behave inconsistently.
- Vehicle/character state and rendered mesh may not stay synchronized.

### Required investigation and repair
- Trace the E-key pressed event through the input manager, fixed update, nearest-vehicle query and enter/exit state changes.
- Measure the actual player-to-vehicle distance and ensure its threshold accounts for the vehicle body dimensions and player interaction point.
- Ensure the interaction prompt reflects whether a vehicle is actually reachable and available.
- Ensure the key press cannot be consumed while the engine is paused/not updating.
- Prevent occupying a destroyed vehicle or a vehicle already owned by another driver.
- Entering a vehicle must hide/disable the walking controller and assign vehicle ownership once.
- Exiting must place the player beside the vehicle at a valid, non-overlapping location; if blocked, try an alternative safe exit point.
- Handle rapid E input, pause/resume, reset, destruction, and invalid vehicle references.
- Find every function that changes a vehicle position. Use one authoritative simulation/movement update per tick. Avoid independently integrating the same vehicle in the player controller, vehicle manager and police system.
- Keep model transform, state position/yaw, wheels, camera and HUD telemetry synchronized.
- Ensure collision response cannot repeatedly push a vehicle in contradictory directions.

### Collision requirements
- The visible body shape and the collision proxy must be reasonably aligned.
- A sphere around the vehicle center is not sufficient as the only high-speed vehicle collision model if the front/rear can pass through walls.
- Implement a box/capsule/OBB approximation appropriate for the existing engine or integrate a browser-compatible physics package only if the environment can build and verify it safely.
- Handle continuous/swept collision where needed to prevent tunneling at higher speed.
- Vehicle-to-vehicle contacts must not be decided only from visually misleading center-distance checks.
- Resolve penetration deterministically and preserve meaningful velocity response.
- No vehicle may teleport between separate transforms, repeatedly jitter, or become uncontrolled after collision.
- Police vehicles must be moved by the same authoritative update process as other vehicles.

### Acceptance tests
- Approach and enter each enabled vehicle type within a documented range.
- An obstructed or distant vehicle does not falsely accept interaction.
- Exit on both sides safely, including beside a wall.
- Drive forward, reverse, brake, and turn in both directions.
- Hit a wall at low and high speeds; the vehicle remains on the correct side and damage response is consistent.
- Collide front-to-front and side-to-side with another vehicle.
- Confirm wheels turn/rotate with the vehicle state.
- Confirm the camera and speedometer follow the player’s actual vehicle.
- Confirm destroyed vehicles cannot be entered or keep receiving active driving updates.
- Reset/restart the game and repeat vehicle interaction without duplicate update loops.

---

## 7. Priority P1 — NPC Identity, Navigation and World Reactions

The NPCs must not feel like identical primitive mannequins with only different shirt colors.

### Gameplay
- Verify each NPC is an individual entity with a stable ID, behavior state, health, movement target and valid lifecycle.
- Implement coherent transitions between patrol, flee, investigate/witness, hostile (when appropriate), hit reaction and incapacitated states.
- Ensure an NPC cannot walk through buildings, become permanently stuck, or continuously target an unreachable waypoint.
- Use the existing sidewalk waypoint graph where possible; improve connected path routing and local avoidance before inventing an entirely new navigation stack.
- Add a stuck timer and recovery behavior.
- Ensure incapacitated NPCs stop receiving movement updates and do not keep reporting crimes.
- Avoid globally random behavior that makes regression tests nondeterministic; inject a seeded random source for test scenarios where feasible.

### Visual identity
- Prefer original, appropriately licensed optimized GLB/GLTF humanoid meshes with verified rig/skeleton and compatible animation clips.
- Use a small set of visibly distinct character silhouettes/outfits/heads/hair/materials rather than one geometry recolored sixteen times.
- Keep civilian, hostile and police character variants distinguishable.
- If no suitable asset can be obtained or imported, implement a more proportionate procedural placeholder, but label it as a fallback—not a realistic human model.
- Never substitute a 2D image billboard for a requested 3D person.
- Keep NPC rendering models separate from movement and collision state.

### Acceptance tests
- NPCs take different plausible sidewalk routes and turn smoothly.
- NPCs avoid or recover from blocked waypoints.
- Nearby NPCs respond to a gunshot using distance to the real sound origin.
- Witness reporting respects actual configured visibility/acoustic rules.
- Hit reactions and incapacitated states do not intersect the ground in obviously broken poses.
- Repeated runs produce reproducible results in seeded tests.

---

## 8. Priority P1 — Police, Crime Rules and Missions

- Verify that weapon discharge, assault, vehicle damage, witnessed events and other configured actions cause the intended wanted-level consequences.
- Avoid reporting every crime as witnessed automatically unless the game deliberately uses that rule.
- Keep the last known player position distinct from current position.
- Police must not retain omniscient player tracking while the player is genuinely out of sight unless explicitly specified by game rules.
- Use road waypoints for police vehicle navigation; avoid manually moving police vehicles through buildings or updating the same vehicle in multiple systems.
- Include a stuck/route recovery mechanism and ensure wanted-level decay occurs only under the specified conditions.
- Every mission must have clear prerequisites, active-step conditions, completion/failure, restart cleanup, rewards and a valid UI state.
- Restarting a mission must not duplicate rogue vehicles, hostile NPCs, listeners or reward callbacks.
- Add a dedicated mission unit-test suite if it is missing.
- Add integration tests for crime → witness/detection → police dispatch → pursuit → escape and for mission start → progress → completion/failure → restart.

---

## 9. Priority P1 — City Collision, Physics and Game Loop Integrity

- Compare world collision boxes with their visible meshes. Fix gaps where invisible colliders block movement or buildings have no meaningful collider.
- Verify ground heights and collision behavior at curbs, sidewalks and road intersections.
- Determine whether `resolveSphereAABBCollision` is overlap resolution or actual swept collision. Names/comments must accurately describe behavior.
- Add high-speed collision tests, initial penetration tests, wall/corner tests and tests under large frame-time deltas.
- Use fixed-step simulation and render interpolation coherently; clamp catch-up work to prevent unbounded loops.
- Ensure `startGame` cannot create multiple concurrent `requestAnimationFrame` loops.
- Pause/resume/title/restart must preserve exactly one active loop and valid input state.
- Remove event listeners and dispose owned geometries, materials and textures on unmount/disposal.
- Avoid creating replacement materials every time an object is damaged if the old material is not disposed.
- FPS shown on screen must be a meaningful smoothed measurement, not presented as a full performance benchmark based on one frame.

---

## 10. Priority P2 — Reduce Flashiness and Improve Professional Presentation

Do this after gameplay controls and critical simulation work.

- Review actual browser screenshots at native size, not only source CSS.
- Reduce excessive pulsing, bright color collisions, unnecessary card-like panels and animations that distract from play.
- Keep the DOM/CSS HUD where appropriate: a browser game HUD is expected to be 2D. Make it feel deliberate and readable instead of trying to make every text element a 3D object.
- Preserve useful health, armor, ammo, mission and wanted information.
- Ensure titles/menus intentionally reveal or obscure the 3D world rather than accidentally looking like a generic dark dashboard.
- Improve building silhouette variety, modeled facade depth, road/sidewalk detail, realistic material response and light/shadow balance.
- For vehicles, replace box-assembled bodies with optimized original/licensed 3D models when feasible.
- For player/NPCs, prefer rigged 3D assets with compatible animation clips. Verify license, file format, scale, orientation, materials and rig before integration.
- Do not download or integrate random assets without verifying source/license and technical compatibility.
- Do not claim "photorealistic" or "AAA" merely because a model file was imported.

---

## 11. Mandatory Test Gates

Read the existing scripts in `package.json` and use the actual available package manager. Run every supported check that can genuinely execute, such as:

- `npm run build`
- `npm run lint` (verify what this script actually does; do not assume it is a linter)
- `npm test`
- Browser smoke tests / Playwright if actually available.

Do not invent results if a command cannot run.

### Regression test matrix

| Area | Required regression |
|---|---|
| Keyboard | W/A/S/D correct for multiple camera angles; no stuck keys |
| Camera | Orbit, aim, transition to driving; no invalid transform |
| Aim | Hands/weapon enter visible aim state; weapon points toward reticle |
| Firing | Ammo, cooldown, muzzle effect, recoil and audio are consistent |
| Hit detection | NPC hit, miss, wall occlusion, range and vehicle hit cases |
| NPC | Health/state transitions; witnesses and flee logic |
| Vehicle interaction | Enter/exit, safe spawn point, repeated key presses |
| Vehicle dynamics | Steering signs, braking, reversal, walls, car-to-car impact |
| Police | Detection, lost sight, search, pursuit and escape |
| Missions | Objective transitions, completion, failure, restart without duplicates |
| Lifecycle | Start/pause/resume/restart/unmount without duplicate loops/listeners |
| Performance | Scenario duration, entity count, FPS/frame-time and console errors where measurable |

When browser tools are available:
- Capture before/after screenshots for title, on-foot gameplay, aiming, firing, NPC impact, driving, and police pursuit.
- Record browser viewport, console errors and network/asset failures.
- Exercise the game with real keyboard/mouse input, not screenshots alone.
- Analyze screenshots using available multimodal visual inspection.
- Attach evidence to the report or link real, accessible artifacts.

When browser tools are not available:
- Provide exact manual reproduction steps and mark browser tests UNVERIFIED. Never claim browser behavior was verified from source code alone.

---

## 12. Reviewer Gate and Bug Ledger

Maintain `BUGS.md` with an entry for every material defect:

- Bug ID.
- Severity.
- Reproduction steps.
- Root cause and affected files.
- Fix summary.
- Regression test.
- Test command or browser journey actually run.
- Evidence/commit.
- Status: OPEN, FIXED-UNVERIFIED, VERIFIED, BLOCKED, or WONTFIX with reason.

Maintain `TEST_RESULTS.md` with actual run output summaries and timestamps. Update `PROJECT_STATUS.md` only after verification. Remove or correct outdated "100% verified" statements if the actual evidence does not support them.

The independent reviewer must return one of:
- **APPROVE** — acceptance criteria and evidence pass.
- **REQUEST CHANGES** — reproducible or plausible unaddressed defect.
- **BLOCKED** — required environment/asset/tool is genuinely unavailable.

A review is not approved just because TypeScript compiles.

---

## 13. Final Deliverables

Deliver the repaired existing project—not a parallel rewrite.

At completion provide:
1. The root-cause report and prioritized bug list.
2. A concise implementation plan and task ownership/handoffs.
3. Exact files changed and why.
4. Actual build, type-check and test outcomes.
5. Browser screenshots or honest manual testing steps.
6. Remaining known issues and blocked items.
7. Evidence of independent reviewer approval or the outstanding review findings.
8. The commit/branch and instructions to run the updated browser game.

Report separately:
- **IMPLEMENTED** = code exists.
- **VERIFIED** = the specified test actually ran and passed.
- **UNVERIFIED** = not executed in a runtime.
- **BLOCKED** = capability or dependency unavailable.

Do not make unsupported completion percentages or invented performance claims.

---

## MANDATORY SELF-DEBUGGING LOOP — TEST, FIX, REBUILD, RETEST

This section is mandatory. **Do not stop after writing code, after one test run, or after producing a plan.** The job is to make the existing project work, discover regressions caused by your own fixes, and keep correcting them until the available acceptance gates pass or a real blocker is documented.

### A. Establish a truthful baseline first

1. Inspect the package manager and lockfile. Use the repository's existing package manager and scripts; do not casually change dependencies or regenerate the lockfile.
2. Before implementation, run the existing type-check/lint, unit tests, and production build using the exact scripts declared by `package.json`. Record each command, exit code, and important output in `BUG_TRIAGE.md` or `TEST_RESULTS.md`.
3. If the baseline already fails, separate pre-existing failures from new failures. Never claim a test passes unless you actually ran it.
4. If you have no terminal, browser or execution capability in the environment, state that clearly and use the strongest available static checks. Do not fabricate a successful build, screenshots, browser session, test output, FPS, or agent review.

### B. Repeat this closed loop for every P0/P1 fix and every cross-system change

Follow the cycle below, then repeat it whenever a test fails or a new defect appears:

**Reproduce → Trace the root cause → Write a failing regression test → Make the smallest appropriate fix → Run focused tests → Run the full test suite and type-check → Build production bundle → Run browser/gameplay checks → Inspect errors and visuals → Independent review → Fix findings → Retest.**

Detailed rules:

1. **Reproduce:** Write down exact steps, input, expected behavior, actual behavior, and whether the problem occurs consistently. For intermittent defects, repeat the scenario and record frequency/conditions where practical.
2. **Trace:** Follow the real call path and source of truth across systems. Check update ordering, coordinate spaces, state ownership, collision shapes, event lifecycle and race conditions. Do not patch a symptom with arbitrary offsets or duplicated state.
3. **Regression test:** Add a focused test that fails before the fix when a practical automated test can represent the defect. Keep meaningful tests; do not delete, skip, weaken, or rewrite assertions merely to get green results.
4. **Fix minimally:** Change the smallest coherent set of files. If a module is fundamentally unsound, refactor or replace that module only after documenting why; preserve working public interfaces and unrelated gameplay.
5. **Focused verification:** Rerun the relevant test immediately after the change. When it fails, inspect the output, identify the cause, fix the cause, and rerun it.
6. **Integration verification:** Run all existing and new tests, TypeScript/type checks, lint checks if configured, and the production build. A passing unit test alone is not sufficient.
7. **Runtime verification:** Launch the app and actually play the affected scenario in a real browser when that capability exists. Inspect browser console errors, failed network requests, uncaught/rejected errors, canvas rendering, controls, HUD state, and visible character/vehicle animation. Capture before/after screenshots or a short recording where possible.
8. **Review your own work adversarially:** Ask what could still break: inverse input mapping, alternate camera angles, repeated start/pause, rapid vehicle entry/exit, multiple targets, blocked shots, overlapping vehicles, NPC death/reaction, and cross-system update order. Create a test for realistic edge cases.
9. **Independent review:** Have a genuinely separate reviewer inspect the diff for correctness, regressions, missing tests and false claims. If real agent delegation is unavailable, switch roles and perform a separate review pass yourself; do not pretend a different agent reviewed it.
10. **Retest after review fixes:** Any code change made in response to review reopens the loop. Repeat all relevant focused tests and the full build/test gates. Run the affected browser scenarios again.
11. **Update evidence:** Only after running the checks, update `TEST_RESULTS.md`, `PROJECT_STATUS.md`, and other docs with the actual outcome, commands, environment and limitations.

**No arbitrary “fixed” declaration:** a bug is `VERIFIED` only when its acceptance test actually ran and passed. Code changes not executed in the relevant runtime remain `FIXED-UNVERIFIED` or `UNVERIFIED`. A blocked check must say what was unavailable and what manual steps would finish verification.

### C. Required automated and browser acceptance scenarios

Adapt these to the real controls and systems already in the repository. Add tests rather than assuming the current test suite covers them.

- **Controls/camera:** Validate left/right and forward/backward directions at camera yaw values such as 0, ±90°, and 180°. Check camera rotation, player orientation, aiming direction and vehicle steering consistently. Include diagonal movement normalization if supported.
- **Aim and shooting:** Verify the aim pose visibly changes; the weapon points toward the reticle/aim point; the shot query starts from the correct weapon/camera origin; the nearest valid target is selected; walls block hits; hitboxes align with rendered entities; targets take damage once per valid hit; ammo/cooldown are consistent; muzzle/recoil/hit feedback is visible. Do not use center-distance approximations as a hidden substitute for actual hit detection unless the design intentionally calls for them and tests prove reliability.
- **NPC response:** Test idle, walking, alerting, taking damage, death/fall, and recovery/state transitions that are part of the game. Check multiple NPC variants and verify the correct NPC is hit rather than one behind it.
- **Vehicles:** Test entering/exiting within and outside interaction range; blocked exit positions; steering and braking; player/vehicle transform synchronization; vehicle-vs-vehicle contact; vehicle-vs-world collision; high-speed collision; spawn/despawn; repeat entry/exit; police-controlled vehicles if they share the same system. Check for tunneling, jitter, overlap, teleporting or double integration.
- **Lifecycle and stability:** Test title → play → pause → resume → title/restart where supported. Ensure no duplicate animation-frame loops, orphaned keyboard/pointer listeners, stale input or duplicate update calls. Watch for console errors and memory/resource leaks where the available tools allow.
- **Open-world loop:** Confirm the player can traverse a connected area, approach and interact with vehicles/NPCs, trigger the intended wanted/crime response if implemented, and return to stable gameplay without getting trapped, falling through the world or losing controls.
- **Regression:** Re-run all pre-existing tests and cover any altered contracts in physics, game rules, save/load and mission progression.

Where Playwright or another browser automation tool is installed, use it for repeatable smoke tests and screenshots; do not add a new heavy testing stack unless necessary and justified. Browser automation does not replace actually checking the rendered 3D scene and gameplay behavior.

### D. Build and release gates — all outcomes must be evidence-based

Do not consider the repair milestone complete until each available gate has been attempted and reported:

- [ ] Dependencies match the existing lockfile and install successfully, or a precise blocker is recorded.
- [ ] TypeScript/type-check passes.
- [ ] Configured lint/static checks pass.
- [ ] Existing tests pass.
- [ ] New regression tests pass.
- [ ] Production build completes successfully.
- [ ] Browser app starts and the core scene renders without fatal console/runtime errors.
- [ ] All reachable P0 acceptance scenarios pass in runtime.
- [ ] The integrated regression suite passes after the last code change.
- [ ] Independent review findings are fixed or explicitly documented.
- [ ] The final diff is checked for accidental deletions, unused assets, debug spam, secrets, broken imports and unrelated changes.
- [ ] Run instructions and actual results are written down.

If a gate fails, diagnose and fix the underlying issue, then rerun it. Do not stop merely because a failure appeared: **the failure is input to the next self-debugging cycle.** Continue until the gate passes, or until a genuine external limitation is reached (missing credentials, unavailable runtime/tool, inaccessible dependency, time/resource ceiling, or a risk requiring owner input). For a genuine blocker, finish all work not blocked, provide evidence, and state precisely what is still unverified. Never conceal red gates.

### E. Safe code-replacement rules: repair, do not restart the project

- Do not rewrite the full game, replace the stack, remove the current game and scaffold a new one, or make a broad architectural migration to avoid debugging.
- Preserve functional code. Delete code only when you have demonstrated it is dead, duplicated, conflicting, unsafe, or incompatible with the corrected implementation. Explain each meaningful deletion in the change summary.
- It is allowed to rewrite a specific function, entity controller, physics helper, animation rig or module when the existing implementation is the root cause and a smaller patch would be more fragile. Keep the scope local, preserve necessary interfaces, and add migration/regression tests.
- Avoid unrelated formatting churn, mass renaming, speculative dependencies and giant single-file changes. Do not put the whole game engine into one replacement file.
- Do not fake missing features using buttons that do nothing, placeholder state, teleport hacks, collision suppression, no-op functions, tests that assert only that objects exist, or visual effects masking gameplay defects.
- Make one coherent change-set at a time; build and test between major change-sets. If a refactor causes widespread breakage, revert or reduce its scope and preserve the previously working behavior.
- Update documentation only after reality changes. Code, tests, screenshots and reports must agree.

---

## REAL 3D OPEN-WORLD GAMEPLAY TARGET (INCREMENTAL, PLAYABLE, HONEST)

The goal is more than a scene that merely renders. Build toward a coherent, interactive 3D open-world game using the current Three.js foundation and current repository structure. Do not promise an AAA-scale GTA clone; first make a stable, convincing playable core, then expand in evidence-based phases.

### Phase 1 — Playable foundation (must work before visual expansion)

- Reliable on-foot movement, camera-relative controls, collision with the world, coherent camera follow and responsive mouse/keyboard input.
- An explorable connected city block/network with streets, sidewalks, buildings, readable scale and safe boundaries; the world must not be a static decorative backdrop.
- Consistent interaction prompts and a working enter/exit-vehicle loop.
- Vehicles that steer, brake, collide and remain synchronized with collision physics.
- Aiming, shooting, hit validation, damage reactions and understandable weapon feedback.
- NPCs with distinct state transitions and reactions; police response only where the implemented rules support it.
- Clear pause/restart behavior, understandable HUD, and a stable browser game loop.

### Phase 2 — Credible open-world systems (only after Phase 1 is stable)

- NPC variation beyond recoloring: use distinct silhouettes, body proportions, hair/headwear, clothing combinations and readable animations. Prefer compatible rigged GLB/GLTF assets where available and properly licensed. If compatible assets or rigging tools are unavailable, improve procedural characters incrementally and report the limitation; do not claim a fully rigged system exists when it does not.
- Better navigation using a road/sidewalk waypoint graph or another tested approach suited to the current world. NPCs and police must not simply move through walls or chase directly through buildings.
- Coherent traffic/vehicle behavior, robust vehicle collision and reasonable acceleration/turning.
- Mission/objective flow, crime/wanted behavior and save/load integration consistent with existing project requirements.
- More believable animation, lighting, materials, sound/impact cues and spatial scale, prioritized by gameplay value and performance.

### Phase 3 — Visual and performance polish

- Reduce excessive flashing, unnecessary glow, oversaturated effects and distracting UI animation. Use consistent lighting, readable contrast, restrained accent colors and a HUD that does not obscure play.
- Prefer usable licensed/owned assets, correct material scale, shadows and level-of-detail appropriate for browser performance. Never download/import assets without checking their source, license and size.
- Add debug overlays only in development mode; do not leave noisy debug output or performance-heavy instrumentation enabled in production.
- Profile the real game before claiming performance improvements. Do not invent FPS or say it is “optimized” without measurements from the available runtime.

### Definition of “real gameplay”

A feature counts as gameplay only if a player can trigger it, observe the result, and the result follows consistent rules. For example, “vehicle entry implemented” requires a player to approach a vehicle, receive a valid interaction, enter and control it, exit safely, and regain on-foot control. “Shooting implemented” requires a visible aim/fire action, a valid target query, collision/occlusion handling, correct damage and an observable hit result. Rendering a model, displaying a button or changing a variable alone does not meet the acceptance criterion.

## EXECUTION ORDER

**Start with the P0 gameplay bugs first.**

1. Inspect latest repository state and reproduce left/right movement inversion.
2. Create the bug ledger and plan.
3. Fix player/camera coordinate basis and controls.
4. Fix aim pose, shot ray, target hitboxes and visible firing feedback.
5. Fix vehicle enter/exit, steering, single-source-of-truth updates and collisions.
6. Fix NPC perception, reactions, navigation and police chase consistency.
7. Run the independent adversarial review; fix findings and rerun regressions.
8. Improve character/vehicle asset quality and reduce visual flashiness without rewriting working gameplay systems.
9. Run final build, unit, integration and browser checks.
10. Update documentation only from actual evidence.

**Do not return a plan alone. Do not perform a wholesale rewrite. Diagnose, correct, test, review, and retest the existing code until the available acceptance gates pass.**
