# Project Requirements: PROJECT APEX: CITY RESPONSE

## 1. Functional Scope & Pillars

1. **Urban Environment**:
   - 240m x 240m interconnected multi-block district.
   - Asphalt roadways with lane markings, pedestrian crosswalks, concrete sidewalks with curbs.
   - Varied buildings (high-rise towers, commercial shops, industrial warehouse depot, civic police station, residential complexes, civic park plaza).
   - Street furniture: functional streetlights, fire hydrants, trees, concrete barriers, ramps, shipping containers.

2. **Locomotion & Player Controller**:
   - Third-person perspective with orbit follow camera, pitch/yaw limits, smooth collision pull-in against walls.
   - Movement: Walk (4 m/s), Sprint (8 m/s), Jump (vertical impulse 7.5 m/s, realistic gravity 18 m/s²).
   - Camera-relative directional movement with smooth character yaw slerp.
   - Smooth animation states: Idle, Walk, Run, Jump-Air, Land, Aim, Vehicle Driving.
   - Contextual interaction: Enter/Exit nearby vehicles with seat transition.

3. **Vehicle Simulation**:
   - Real vehicle physics: Acceleration torque, top speed curve, engine braking, handbrake drift, dynamic steering decay with speed, tire grip friction, suspension height compliance.
   - 3 distinct vehicle classes:
     - `APEX_SPORT`: High acceleration, low mass, sharp steering.
     - `METRO_PATROL`: Balanced law-enforcement cruiser with active dual-tone sirens and flashing emergency strobe lightbars.
     - `TITAN_ENFORCER`: Heavy armored SUV with high ramming mass and durability.
   - Damage model: Collision impulse converts to structural integrity loss, engine smoke particles when critical, explosion on zero health.
   - Recovery mechanism: flip recovery button / auto-upright if overturned.

4. **NPC AI & Pedestrians**:
   - State machine: `IDLE`, `PATROL_WALK`, `FLEE`, `WITNESS_ALERT`, `INCAPACITATED`.
   - Pedestrian sidewalk waypoint following and street crossing.
   - Reaction to disturbances: Gunfire within 40m triggers panic flee and distress shouts; nearby witnesses call police after 3.5s delay if not interrupted.
   - Impact physics: Non-graphic stagger, knockback from vehicle bumper hits, incapacitation on zero health.

5. **Wanted System & Police Pursuit**:
   - Escalation 1 to 5 stars:
     - 1 Star: Reckless driving / minor property disturbance.
     - 2 Star: Pedestrian assault / vehicle theft.
     - 3 Star: Firearm discharge in public / officer engaged.
     - 4 Star: Multiple officers down / high-speed cruiser interception.
     - 5 Star: Tactical containment / roadblocks.
   - Dynamic search logic: Patrol units navigate to player's last reported location.
   - Evasion mechanic: Evading line of sight for 15s causes wanted stars to flash and clear.

6. **Combat Mechanics**:
   - Raycast hit detection with precise origin from weapon muzzle to screen reticle aim point.
   - Weapon inventory: Service Pistol (semi-auto, accurate), Apex SMG (rapid auto fire), Tactical Shotgun (pellet spread).
   - Recoil, ammo magazines, reload animations and timers.
   - Non-graphic impact feedback, spark particles on concrete/metal, staggered reactions.

7. **Missions**:
   - Mission 1: "Courier Blitz" (Multi-point timed delivery challenge).
   - Mission 2: "Interception Protocol" (High-speed pursuit & vehicle takedown).
   - Mission 3: "District Extraction" (Infiltration, syndicate skirmish, package retrieval, evading high-heat police search).

8. **User Interface & Audio**:
   - Interactive title screen with start, settings, controls guide.
   - In-game HUD: Circular radar minimap with live GPS route rendering, health/armor meters, weapon/ammo widget, speedometer and damage gauge, wanted stars, mission objective banner.
   - Full Web Audio synthesizer for all sounds (engines, gunshots, sirens, screeches, UI).
