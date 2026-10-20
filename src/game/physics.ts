import type { BoundingBox3D, Ray3D, RayHit } from './types.ts';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const V3 = {
  create: (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z }),
  clone: (v: Vec3): Vec3 => ({ x: v.x, y: v.y, z: v.z }),
  set: (v: Vec3, x: number, y: number, z: number): Vec3 => {
    v.x = x;
    v.y = y;
    v.z = z;
    return v;
  },
  add: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }),
  sub: (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }),
  scale: (v: Vec3, s: number): Vec3 => ({ x: v.x * s, y: v.y * s, z: v.z * s }),
  dot: (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z,
  cross: (a: Vec3, b: Vec3): Vec3 => ({
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  }),
  lengthSq: (v: Vec3): number => v.x * v.x + v.y * v.y + v.z * v.z,
  length: (v: Vec3): number => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z),
  distanceSq: (a: Vec3, b: Vec3): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return dx * dx + dy * dy + dz * dz;
  },
  distance: (a: Vec3, b: Vec3): number => Math.sqrt(V3.distanceSq(a, b)),
  normalize: (v: Vec3): Vec3 => {
    const len = V3.length(v);
    if (len < 0.000001) return { x: 0, y: 0, z: 0 };
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  },
  lerp: (a: Vec3, b: Vec3, t: number): Vec3 => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }),
};

/**
 * Check if two AABBs overlap.
 */
export function checkAABBOverlap(a: BoundingBox3D, b: BoundingBox3D): boolean {
  return (
    a.min.x <= b.max.x &&
    a.max.x >= b.min.x &&
    a.min.y <= b.max.y &&
    a.max.y >= b.min.y &&
    a.min.z <= b.max.z &&
    a.max.z >= b.min.z
  );
}

/**
 * Check if a point is inside an AABB.
 */
export function isPointInsideAABB(p: Vec3, box: BoundingBox3D): boolean {
  return (
    p.x >= box.min.x &&
    p.x <= box.max.x &&
    p.y >= box.min.y &&
    p.y <= box.max.y &&
    p.z >= box.min.z &&
    p.z <= box.max.z
  );
}

/**
 * Raycast against an AABB using the slab method.
 */
export function intersectRayAABB(ray: Ray3D, box: BoundingBox3D, maxDist = 500): RayHit {
  let tmin = 0;
  let tmax = maxDist;
  let normal = { x: 0, y: 0, z: 0 };

  const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];
  for (const axis of axes) {
    const dir = ray.direction[axis];
    const orig = ray.origin[axis];
    const bmin = box.min[axis];
    const bmax = box.max[axis];

    if (Math.abs(dir) < 0.000001) {
      if (orig < bmin || orig > bmax) {
        return { hit: false, point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 0 }, distance: Infinity };
      }
    } else {
      const invD = 1 / dir;
      let t1 = (bmin - orig) * invD;
      let t2 = (bmax - orig) * invD;
      let sign = -1;

      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
        sign = 1;
      }

      if (t1 > tmin) {
        tmin = t1;
        normal = { x: 0, y: 0, z: 0 };
        normal[axis] = sign * Math.sign(dir);
      }
      tmax = Math.min(tmax, t2);

      if (tmin > tmax) {
        return { hit: false, point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 0 }, distance: Infinity };
      }
    }
  }

  if (tmin < 0 || tmin > maxDist) {
    return { hit: false, point: { x: 0, y: 0, z: 0 }, normal: { x: 0, y: 0, z: 0 }, distance: Infinity };
  }

  const hitPoint = V3.add(ray.origin, V3.scale(ray.direction, tmin));
  return {
    hit: true,
    point: hitPoint,
    normal,
    distance: tmin,
  };
}

/**
 * Swept sphere collision resolution against an AABB.
 * Returns the adjusted position of the sphere after sliding along wall planes.
 */
export function resolveSphereAABBCollision(
  position: Vec3,
  radius: number,
  box: BoundingBox3D
): { position: Vec3; collided: boolean; normal: Vec3 } {
  // Find closest point on AABB to sphere center
  const closestX = Math.max(box.min.x, Math.min(position.x, box.max.x));
  const closestY = Math.max(box.min.y, Math.min(position.y, box.max.y));
  const closestZ = Math.max(box.min.z, Math.min(position.z, box.max.z));

  const diffX = position.x - closestX;
  const diffY = position.y - closestY;
  const diffZ = position.z - closestZ;

  const distSq = diffX * diffX + diffY * diffY + diffZ * diffZ;

  if (distSq < radius * radius && distSq > 0.000001) {
    const dist = Math.sqrt(distSq);
    const overlap = radius - dist;
    const nx = diffX / dist;
    const ny = diffY / dist;
    const nz = diffZ / dist;

    return {
      position: {
        x: position.x + nx * overlap,
        y: position.y + ny * overlap,
        z: position.z + nz * overlap,
      },
      collided: true,
      normal: { x: nx, y: ny, z: nz },
    };
  }

  // Inside the box
  if (distSq <= 0.000001) {
    // Push out towards the nearest face
    const dx1 = Math.abs(position.x - box.min.x);
    const dx2 = Math.abs(position.x - box.max.x);
    const dz1 = Math.abs(position.z - box.min.z);
    const dz2 = Math.abs(position.z - box.max.z);

    const minPush = Math.min(dx1, dx2, dz1, dz2);
    const outPos = { ...position };
    let norm = { x: 0, y: 0, z: 0 };

    if (minPush === dx1) {
      outPos.x = box.min.x - radius;
      norm = { x: -1, y: 0, z: 0 };
    } else if (minPush === dx2) {
      outPos.x = box.max.x + radius;
      norm = { x: 1, y: 0, z: 0 };
    } else if (minPush === dz1) {
      outPos.z = box.min.z - radius;
      norm = { x: 0, y: 0, z: -1 };
    } else {
      outPos.z = box.max.z + radius;
      norm = { x: 0, y: 0, z: 1 };
    }

    return {
      position: outPos,
      collided: true,
      normal: norm,
    };
  }

  return {
    position,
    collided: false,
    normal: { x: 0, y: 0, z: 0 },
  };
}

/**
 * Step vehicle physics over delta time.
 * Calculates forward acceleration, braking, lateral tire grip friction,
 * steering angle decay with speed, and updates position and velocity.
 */
export interface VehiclePhysicsInput {
  throttle: number; // -1 to 1 (1 = accelerate forward, -1 = reverse)
  steering: number; // -1 to 1 (left to right)
  handbrake: boolean;
}

export interface VehiclePhysicsState {
  position: Vec3;
  velocity: Vec3;
  yaw: number; // radians
  speed: number;
}

export function updateVehiclePhysics(
  state: VehiclePhysicsState,
  input: VehiclePhysicsInput,
  config: {
    acceleration: number;
    maxSpeed: number;
    reverseSpeed: number;
    brakeForce: number;
    turnSpeed: number;
    drag: number;
    grip: number;
  },
  dt: number
): VehiclePhysicsState {
  const clampDt = Math.min(dt, 0.1);

  // Vehicle forward and right vectors based on yaw
  const forwardX = Math.sin(state.yaw);
  const forwardZ = Math.cos(state.yaw);
  const rightX = forwardZ;
  const rightZ = -forwardX;

  // Decompose current velocity into longitudinal (forward) and lateral (sideways) components
  const forwardVelocity = state.velocity.x * forwardX + state.velocity.z * forwardZ;
  const lateralVelocity = state.velocity.x * rightX + state.velocity.z * rightZ;

  // Steering: at high speeds, steering angle decreases slightly to preserve stability
  const speedRatio = Math.abs(forwardVelocity) / (config.maxSpeed || 1);
  const effectiveTurnSpeed = config.turnSpeed * (1 - speedRatio * 0.45);
  
  // Turn vehicle only if moving
  let yawDelta = 0;
  if (Math.abs(forwardVelocity) > 0.2) {
    const directionSign = forwardVelocity >= 0 ? 1 : -1;
    yawDelta = input.steering * effectiveTurnSpeed * clampDt * directionSign;
  }
  const newYaw = state.yaw + yawDelta;

  // Longitudinal acceleration & braking
  let newForwardVel = forwardVelocity;
  if (input.throttle > 0) {
    // Accelerating forward
    if (forwardVelocity < config.maxSpeed) {
      newForwardVel += input.throttle * config.acceleration * clampDt;
      if (newForwardVel > config.maxSpeed) newForwardVel = config.maxSpeed;
    }
  } else if (input.throttle < 0) {
    // Reversing or braking
    if (forwardVelocity > 0.5) {
      // Braking while moving forward
      newForwardVel -= config.brakeForce * clampDt;
      if (newForwardVel < 0) newForwardVel = 0;
    } else {
      // Reversing
      newForwardVel += input.throttle * (config.acceleration * 0.6) * clampDt;
      if (newForwardVel < -config.reverseSpeed) newForwardVel = -config.reverseSpeed;
    }
  } else {
    // Natural engine rolling resistance / deceleration
    const dragLoss = (config.drag * 2.0) * clampDt;
    if (newForwardVel > 0) {
      newForwardVel = Math.max(0, newForwardVel - dragLoss);
    } else if (newForwardVel < 0) {
      newForwardVel = Math.min(0, newForwardVel + dragLoss);
    }
  }

  // Handbrake action
  if (input.handbrake) {
    const handbrakeBraking = config.brakeForce * 1.5 * clampDt;
    if (newForwardVel > 0) {
      newForwardVel = Math.max(0, newForwardVel - handbrakeBraking);
    } else if (newForwardVel < 0) {
      newForwardVel = Math.min(0, newForwardVel + handbrakeBraking);
    }
  }

  // Lateral grip: cancel out sideways slide, unless handbraking (which allows drift)
  const lateralGripFactor = input.handbrake ? config.grip * 0.25 : config.grip;
  const newLateralVel = lateralVelocity * Math.max(0, 1 - lateralGripFactor * clampDt * 10);

  // Reconstruct velocity from forward & right vectors (with updated yaw)
  const updatedForwardX = Math.sin(newYaw);
  const updatedForwardZ = Math.cos(newYaw);
  const updatedRightX = updatedForwardZ;
  const updatedRightZ = -updatedForwardX;

  const newVelX = updatedForwardX * newForwardVel + updatedRightX * newLateralVel;
  const newVelZ = updatedForwardZ * newForwardVel + updatedRightZ * newLateralVel;

  // New position
  const newPosX = state.position.x + newVelX * clampDt;
  const newPosZ = state.position.z + newVelZ * clampDt;

  const currentSpeed = Math.sqrt(newVelX * newVelX + newVelZ * newVelZ);

  return {
    position: { x: newPosX, y: state.position.y, z: newPosZ },
    velocity: { x: newVelX, y: state.velocity.y, z: newVelZ },
    yaw: newYaw,
    speed: currentSpeed,
  };
}

/**
 * Compute collision response between a vehicle and an obstacle (e.g. wall/barrier).
 * Calculates bounce/deflection and impact damage based on collision speed.
 */
export function calculateCollisionImpulse(
  incomingVelocity: Vec3,
  collisionNormal: Vec3,
  restitution = 0.25
): { reflectedVelocity: Vec3; impactSpeed: number; damage: number } {
  // Dot product between velocity and normal
  const velDotNormal = V3.dot(incomingVelocity, collisionNormal);

  if (velDotNormal >= 0) {
    // Moving away from or parallel to normal
    return { reflectedVelocity: incomingVelocity, impactSpeed: 0, damage: 0 };
  }

  const impactSpeed = Math.abs(velDotNormal);

  // Reflection formula: v' = v - (1 + e) * (v . n) * n
  const impulseScale = -(1 + restitution) * velDotNormal;
  const impulseVector = V3.scale(collisionNormal, impulseScale);
  const reflectedVelocity = V3.add(incomingVelocity, impulseVector);

  // Proportional damage: minor threshold at 4 m/s (approx 14 km/h)
  let damage = 0;
  if (impactSpeed > 4.0) {
    damage = Math.round((impactSpeed - 4.0) * 3.5);
  }

  return {
    reflectedVelocity,
    impactSpeed,
    damage,
  };
}
