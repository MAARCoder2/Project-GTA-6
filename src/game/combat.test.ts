import test from 'node:test';
import assert from 'node:assert/strict';
import { queryRaycastIntersection, type Ray3D, type BoundingBox3D } from './physics.ts';
import { computeBulletDamage, WEAPON_REGISTRY } from './rules.ts';


test('Bullet ray hits unobstructed target NPC', () => {
  const ray: Ray3D = {
    origin: { x: 0, y: 1.5, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
  };
  const npcs = [{ id: 'npc_1', position: { x: 0, y: 0, z: 15 } }];
  const worldBoxes: BoundingBox3D[] = [];

  const res = queryRaycastIntersection(ray, 45, worldBoxes, npcs, []);
  assert.equal(res.hit, true);
  assert.equal(res.targetType, 'NPC');
  assert.equal(res.targetId, 'npc_1');
  assert.ok(Math.abs(res.distance - 14.6) < 0.5);
});

test('Wall blocker occludes shot from hitting NPC behind it', () => {
  const ray: Ray3D = {
    origin: { x: 0, y: 1.5, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
  };
  // Wall at z = 8
  const wall: BoundingBox3D = {
    min: { x: -5, y: 0, z: 7.5 },
    max: { x: 5, y: 10, z: 8.5 },
  };
  // NPC at z = 15 behind wall
  const npcs = [{ id: 'npc_behind_wall', position: { x: 0, y: 0, z: 15 } }];

  const res = queryRaycastIntersection(ray, 45, [wall], npcs, []);
  assert.equal(res.hit, true);
  assert.equal(res.targetType, 'WORLD');
  assert.ok(res.distance < 8.0, 'Bullet stopped at world wall');
  assert.notEqual(res.targetId, 'npc_behind_wall', 'NPC behind wall must not be hit');
});

test('Nearest target is selected when multiple targets are aligned', () => {
  const ray: Ray3D = {
    origin: { x: 0, y: 1.5, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
  };
  // NPC 1 at z = 10, NPC 2 at z = 20
  const npcs = [
    { id: 'npc_far', position: { x: 0, y: 0, z: 20 } },
    { id: 'npc_near', position: { x: 0, y: 0, z: 10 } },
  ];

  const res = queryRaycastIntersection(ray, 45, [], npcs, []);
  assert.equal(res.targetId, 'npc_near', 'Nearest target must be struck first');
});

test('Shot aimed past target misses', () => {
  const ray: Ray3D = {
    origin: { x: 0, y: 1.5, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
  };
  // NPC off to the side at x = 3
  const npcs = [{ id: 'npc_side', position: { x: 3, y: 0, z: 10 } }];

  const res = queryRaycastIntersection(ray, 45, [], npcs, []);
  assert.equal(res.hit, false, 'Bullet aimed past target must miss');
});

test('Weapon definitions adhere to specifications', () => {
  const pistol = WEAPON_REGISTRY.PISTOL;
  assert.equal(pistol.magazineSize, 15);
  assert.equal(pistol.damage, 34);

  const smg = WEAPON_REGISTRY.SMG;
  assert.equal(smg.magazineSize, 30);
  assert.equal(smg.automatic, true);

  const shotgun = WEAPON_REGISTRY.SHOTGUN;
  assert.equal(shotgun.magazineSize, 6);
  assert.equal(shotgun.pellets, 6);
});
