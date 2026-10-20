import test from 'node:test';
import assert from 'node:assert/strict';
import {
  V3,
  checkAABBOverlap,
  isPointInsideAABB,
  intersectRayAABB,
  resolveSphereAABBCollision,
  updateVehiclePhysics,
  calculateCollisionImpulse,
} from './physics.ts';

test('V3 vector mathematics operations', () => {
  const a = V3.create(1, 2, 3);
  const b = V3.create(4, -1, 2);

  const sum = V3.add(a, b);
  assert.deepEqual(sum, { x: 5, y: 1, z: 5 });

  const diff = V3.sub(b, a);
  assert.deepEqual(diff, { x: 3, y: -3, z: -1 });

  const scaled = V3.scale(a, 2.5);
  assert.deepEqual(scaled, { x: 2.5, y: 5, z: 7.5 });

  const dot = V3.dot(a, b);
  assert.equal(dot, 1 * 4 + 2 * -1 + 3 * 2); // 8

  const len = V3.length(V3.create(3, 4, 0));
  assert.equal(len, 5);

  const normalized = V3.normalize(V3.create(0, 10, 0));
  assert.deepEqual(normalized, { x: 0, y: 1, z: 0 });
});

test('AABB overlap and point containment detection', () => {
  const boxA = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 10, y: 10, z: 10 },
  };

  const boxB = {
    min: { x: 5, y: 5, z: 5 },
    max: { x: 15, y: 15, z: 15 },
  };

  const boxC = {
    min: { x: 20, y: 20, z: 20 },
    max: { x: 25, y: 25, z: 25 },
  };

  assert.equal(checkAABBOverlap(boxA, boxB), true);
  assert.equal(checkAABBOverlap(boxA, boxC), false);

  assert.equal(isPointInsideAABB({ x: 5, y: 5, z: 5 }, boxA), true);
  assert.equal(isPointInsideAABB({ x: 12, y: 5, z: 5 }, boxA), false);
});

test('Raycast AABB intersection slab test', () => {
  const box = {
    min: { x: -2, y: -2, z: 5 },
    max: { x: 2, y: 2, z: 9 },
  };

  // Direct hit ray
  const rayHit = {
    origin: { x: 0, y: 0, z: 0 },
    direction: { x: 0, y: 0, z: 1 },
  };
  const hit = intersectRayAABB(rayHit, box);
  assert.equal(hit.hit, true);
  assert.equal(Math.round(hit.distance), 5);
  assert.equal(hit.point.z, 5);

  // Miss ray
  const rayMiss = {
    origin: { x: 0, y: 0, z: 0 },
    direction: { x: 1, y: 0, z: 0 },
  };
  const miss = intersectRayAABB(rayMiss, box);
  assert.equal(miss.hit, false);
});

test('Swept sphere collision with AABB wall sliding', () => {
  const wallBox = {
    min: { x: 10, y: 0, z: -5 },
    max: { x: 12, y: 10, z: 5 },
  };

  // Sphere attempting to penetrate wall from left
  const spherePos = { x: 9.8, y: 1, z: 0 };
  const radius = 0.5;

  const res = resolveSphereAABBCollision(spherePos, radius, wallBox);
  assert.equal(res.collided, true);
  // Sphere pushed out to box.min.x - radius = 9.5
  assert.ok(res.position.x <= 9.51);
});

test('Vehicle physics acceleration and braking forces', () => {
  const initial = {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    yaw: 0,
    speed: 0,
  };

  const config = {
    acceleration: 20.0,
    maxSpeed: 40.0,
    reverseSpeed: 10.0,
    brakeForce: 30.0,
    turnSpeed: 2.5,
    drag: 1.0,
    grip: 0.95,
  };

  // Accelerate forward for 1 second (10 steps of 0.1s)
  let state = initial;
  for (let i = 0; i < 10; i++) {
    state = updateVehiclePhysics(state, { throttle: 1, steering: 0, handbrake: false }, config, 0.1);
  }

  assert.ok(state.speed > 15, `Expected vehicle speed > 15 m/s, got ${state.speed}`);
  assert.ok(state.position.z > 5, 'Vehicle moved forward in Z direction');

  // Apply full brakes
  for (let i = 0; i < 10; i++) {
    state = updateVehiclePhysics(state, { throttle: -1, steering: 0, handbrake: false }, config, 0.1);
  }
  assert.ok(state.speed < 5, `Vehicle slowed down under braking, got ${state.speed}`);
});

test('Collision impulse and damage deflection calculation', () => {
  const incomingVel = { x: 0, y: 0, z: 15 }; // 15 m/s into wall
  const wallNormal = { x: 0, y: 0, z: -1 };

  const impulse = calculateCollisionImpulse(incomingVel, wallNormal, 0.3);
  assert.equal(impulse.impactSpeed, 15);
  assert.ok(impulse.damage > 0, 'Collision at 15 m/s caused damage');
  assert.ok(impulse.reflectedVelocity.z < 0, 'Velocity deflected backward');
});
