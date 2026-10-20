import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveVehicleAABBCollision,
  isPointInsideAABB,
  updateVehiclePhysics,
  type BoundingBox3D,
  type Vec3,
} from './physics.ts';

test('Vehicle multi-point collision stops front bumper from penetrating wall', () => {
  // Wall located at z = 10
  const wallBox: BoundingBox3D = {
    min: { x: -10, y: 0, z: 9.8 },
    max: { x: 10, y: 5, z: 12.0 },
  };

  // Car facing forward (yaw = 0, along +Z) with center at z = 7.5
  // Length is 4.4m, so front bumper extends to z = 7.5 + 4.4 * 0.38 = 9.17 + radius(1.0) = 10.17 (penetrates!)
  const carPos: Vec3 = { x: 0, y: 0, z: 8.5 };
  const carDims = { width: 2.0, height: 1.3, length: 4.4 };

  const res = resolveVehicleAABBCollision(carPos, 0, carDims, wallBox);
  assert.equal(res.collided, true, 'Front bumper must detect wall collision');
  assert.ok(res.position.z < 8.5, 'Car pushed backward out of wall');
});

test('Safe vehicle exit selects clear side when driver side is obstructed', () => {
  const carPos: Vec3 = { x: 0, y: 0, z: 10 };
  const carYaw = 0; // Forward is +Z, driver side (left) is -X, passenger side (right) is +X
  const carWidth = 2.0;

  // Wall flush against driver side (-X) at x = -5.0 to -0.9
  const wallOnDriverSide: BoundingBox3D = {
    min: { x: -5.0, y: 0, z: 5 },
    max: { x: -0.9, y: 5, z: 15 },
  };

  // Candidate exit positions based on car basis
  const sideDist = carWidth * 0.5 + 1.2;
  const forwardX = Math.sin(carYaw);
  const forwardZ = Math.cos(carYaw);
  const rightX = forwardZ;
  const rightZ = -forwardX;

  // Driver side test (car left: -right)
  const driverSidePos: Vec3 = { x: carPos.x - rightX * sideDist, y: 0, z: carPos.z - rightZ * sideDist };
  const isDriverBlocked = isPointInsideAABB(driverSidePos, wallOnDriverSide);
  assert.equal(isDriverBlocked, true, 'Driver side should be blocked by wall');

  // Passenger side fallback (car right: +right)
  const passengerSidePos: Vec3 = { x: carPos.x + rightX * sideDist, y: 0, z: carPos.z + rightZ * sideDist };
  const isPassengerBlocked = isPointInsideAABB(passengerSidePos, wallOnDriverSide);
  assert.equal(isPassengerBlocked, false, 'Passenger side should be clear for safe exit');
});

test('Vehicle steering turns towards screen right when input.steering is positive', () => {
  const initial = {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 10 },
    yaw: 0,
    speed: 10,
  };
  const config = {
    acceleration: 20,
    maxSpeed: 40,
    reverseSpeed: 10,
    brakeForce: 30,
    turnSpeed: 2.5,
    drag: 1.0,
    grip: 0.95,
  };

  // Steer right (steering = 1)
  const turned = updateVehiclePhysics(initial, { throttle: 1, steering: 1, handbrake: false }, config, 0.1);
  // In our coordinate basis where looking +Z has screen right at +X, yaw increases (positive yaw)
  assert.ok(turned.yaw > 0, `Expected yaw > 0 for right turn, got ${turned.yaw}`);
  assert.ok(turned.velocity.x > 0, `Expected velocity.x > 0 (screen right), got ${turned.velocity.x}`);
});
