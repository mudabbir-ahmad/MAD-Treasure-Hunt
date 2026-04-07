import * as geolib from 'geolib';

// --- FOV Configuration ---
const FOV_DISTANCE = 20;   // metres — radius of arc + length of straight edges
const FOV_ANGLE = 45;      // degrees — total field of view (halved for each side)

// Convert raw Magnetometer {x, y} reading to a 0-360° heading (0° = north)
const toHeading = ({x, y}) => {
  const angle = Math.atan2(y, x) * (180 / Math.PI);
  const heading = 90 - angle;
  return heading < 0 ? heading + 360 : heading % 360;
};

// Build a pie-shaped FOV sector as polygon coordinates
const getFovCone = (location, headingDeg, radiusMeters = FOV_DISTANCE, halfAngle = FOV_ANGLE / 2, arcSegments = 20) => {
  const origin = {latitude: location.latitude, longitude: location.longitude};
  const startBearing = headingDeg - halfAngle;
  const endBearing = headingDeg + halfAngle;
  const step = (endBearing - startBearing) / arcSegments;

  // Tip of the sector
  const points = [location];

  // Arc points at radiusMeters distance from origin
  for (let i = 0; i <= arcSegments; i++) {
    const bearing = startBearing + step * i;
    const dest = geolib.computeDestinationPoint(origin, radiusMeters, bearing);
    points.push({latitude: dest.latitude, longitude: dest.longitude});
  }

  return points;
};

const isWithinRadius = (playerCoords, cacheCoords, radius) => {
  const distance = geolib.getDistance(playerCoords, cacheCoords);
  return distance <= radius;
};

const isLookingAtCache = (playerHeading, playerCoords, cacheCoords, tolerance = 20) => {
  if (playerHeading === null || playerHeading === undefined) {
    return false;
  }
  const bearingToCache = geolib.getRhumbLineBearing(playerCoords, cacheCoords);
  const diff = Math.abs(bearingToCache - playerHeading);
  return diff <= tolerance || diff >= 360 - tolerance;
};

export { toHeading, getFovCone, isWithinRadius, isLookingAtCache };

