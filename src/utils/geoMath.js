import * as geolib from 'geolib';

// Convert raw Magnetometer {x, y} reading to a 0-360° heading
const toHeading = ({x, y}) => {
  const angle = Math.atan2(y, x) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
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

export { toHeading, isWithinRadius, isLookingAtCache };

