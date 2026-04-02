import * as geolib from 'geolib';

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

export { isWithinRadius, isLookingAtCache };

