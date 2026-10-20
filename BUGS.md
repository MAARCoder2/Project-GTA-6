# Bug & Defect Ledger: PROJECT APEX

| Bug ID | Severity | System | Symptom | Root Cause | Resolution | Status |
|---|---|---|---|---|---|---|
| BUG-001 | High | Build / TS | TS2741: `Scene` missing `isGroup` property when passed to entity constructors | Entity constructors accepted `THREE.Group` instead of polymorphic `THREE.Object3D` | Widened constructor signatures in `VehicleManager`, `NPCManager`, `MissionSystem`, and `PlayerController` to accept `THREE.Object3D` | FIXED |
| BUG-002 | High | Build / TS | TS2304: Cannot find name `updateVehiclePhysics` in `PlayerController.ts` | Missing import statement in player entity file | Added `updateVehiclePhysics` import from `../physics.ts` | FIXED |
| BUG-003 | Medium | Lighting | Player character back appeared in shadow under directional sunlight | Single overhead directional light placed at high angle | Added city street-level fill light `THREE.DirectionalLight(0x93c5fd, 1.2)` at `(-40, 30, -30)` for balanced character contrast | FIXED |
| BUG-004 | Low | UI / Mobile | Minimap overlay slightly large on small 390px viewports | Fixed pixel size on radar container | Made minimap responsive with clamp boundaries | FIXED |
| BUG-005 | Low | Audio | Browser Autoplay warning on Web Audio Context before user gesture | Modern browsers require user interaction gesture before audio context starts | Implemented `gameAudio.init()` and `gameAudio.resumeContext()` triggered on mouse clicks and key events | FIXED |
