import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMovementVector } from './physics.ts';

test('Movement direction at cameraYaw = 0 (Looking along +Z)', () => {
  // At yaw 0, camera is at -Z looking towards +Z
  // Forward (W) is +Z
  const fwd = computeMovementVector(1, 0, 0);
  assert.ok(Math.abs(fwd.x) < 0.001);
  assert.ok(fwd.z > 0.99, `Expected fwd.z > 0.99, got ${fwd.z}`);

  // Backward (S) is -Z
  const bwd = computeMovementVector(-1, 0, 0);
  assert.ok(Math.abs(bwd.x) < 0.001);
  assert.ok(bwd.z < -0.99, `Expected bwd.z < -0.99, got ${bwd.z}`);

  // Right (D): looking towards +Z, screen right is +X
  const right = computeMovementVector(0, 1, 0);
  assert.ok(right.x > 0.99, `Expected right.x > 0.99 (screen right), got ${right.x}`);
  assert.ok(Math.abs(right.z) < 0.001);

  // Left (A): looking towards +Z, screen left is -X
  const left = computeMovementVector(0, -1, 0);
  assert.ok(left.x < -0.99, `Expected left.x < -0.99 (screen left), got ${left.x}`);
  assert.ok(Math.abs(left.z) < 0.001);
});

test('Movement direction at cameraYaw = +90 deg (PI/2, looking along +X)', () => {
  const yaw = Math.PI / 2;
  // Forward (W) is +X
  const fwd = computeMovementVector(1, 0, yaw);
  assert.ok(fwd.x > 0.99, `Expected fwd.x > 0.99, got ${fwd.x}`);
  assert.ok(Math.abs(fwd.z) < 0.001);

  // Right (D) should be -Z (clockwise in X-Z plane)
  const right = computeMovementVector(0, 1, yaw);
  assert.ok(Math.abs(right.x) < 0.001);
  assert.ok(right.z < -0.99, `Expected right.z < -0.99, got ${right.z}`);
});

test('Movement direction at cameraYaw = -90 deg (-PI/2, looking along -X)', () => {
  const yaw = -Math.PI / 2;
  // Forward (W) is -X
  const fwd = computeMovementVector(1, 0, yaw);
  assert.ok(fwd.x < -0.99, `Expected fwd.x < -0.99, got ${fwd.x}`);
  assert.ok(Math.abs(fwd.z) < 0.001);

  // Right (D) should be +Z
  const right = computeMovementVector(0, 1, yaw);
  assert.ok(Math.abs(right.x) < 0.001);
  assert.ok(right.z > 0.99, `Expected right.z > 0.99, got ${right.z}`);
});

test('Movement direction at cameraYaw = 180 deg (PI, looking along -Z)', () => {
  const yaw = Math.PI;
  // Forward (W) is -Z
  const fwd = computeMovementVector(1, 0, yaw);
  assert.ok(Math.abs(fwd.x) < 0.001);
  assert.ok(fwd.z < -0.99, `Expected fwd.z < -0.99, got ${fwd.z}`);

  // Right (D) should be -X
  const right = computeMovementVector(0, 1, yaw);
  assert.ok(right.x < -0.99, `Expected right.x < -0.99, got ${right.x}`);
  assert.ok(Math.abs(right.z) < 0.001);
});

test('Diagonal input normalization prevents speed exploit', () => {
  const diagonal = computeMovementVector(1, 1, 0);
  const len = Math.sqrt(diagonal.x * diagonal.x + diagonal.z * diagonal.z);
  assert.ok(Math.abs(len - 1.0) < 0.001, `Expected diagonal length to be normalized to 1.0, got ${len}`);
});
