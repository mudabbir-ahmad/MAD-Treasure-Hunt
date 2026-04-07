import * as geolib from 'geolib';

// --- FOV Configuration ---
const FOV_SIZE = 50;            // metres — radius of the visible FOV cone drawn on screen
const FOV_ANGLE = 60;           // degrees — total field of view (halved for each side)
const CACHE_CLAIM_TIMER = 5;    // seconds — how long the player must hold a cache in the claim cone to claim it

// Convert raw Magnetometer {x, y} reading to a 0-360° heading (0° = north)
const toHeading = ({x, y}) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    const heading = 90 - angle;
    return heading < 0 ? heading + 360 : heading % 360;
};

// Build a pie-shaped FOV sector as polygon coordinates
// radiusMeters defaults to FOV_SIZE (the visible cone) — pass a different value to build the invisible claim cone
const getFovCone = (location, headingDeg, radiusMeters = FOV_SIZE, halfAngle = FOV_ANGLE / 2, arcSegments = 20) => {
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

const isLookingAtCache = (playerHeading, playerCoords, cacheCoords, tolerance = FOV_ANGLE / 2) => {
    if (playerHeading === null || playerHeading === undefined) {
        return false;
    }
    const bearingToCache = geolib.getRhumbLineBearing(playerCoords, cacheCoords);
    const diff = Math.abs(bearingToCache - playerHeading);
    return diff <= tolerance || diff >= 360 - tolerance;
};

// Checks whether a cache falls within the invisible claim sector
// The claim sector uses the same FOV_ANGLE as the visible cone but extends to the
// admin-defined claimDistance rather than the visible FOV_SIZE.
// If the cache sits inside this sector the claiming countdown is triggered.
const isInClaimCone = (playerHeading, playerCoords, cacheCoords, claimDistance) => {
    if (playerHeading === null || playerHeading === undefined) return false;
    // Cache must be within the admin-configured claim distance
    if (!isWithinRadius(playerCoords, cacheCoords, claimDistance)) return false;
    // Cache must also fall within the same angular width as the visible cone
    return isLookingAtCache(playerHeading, playerCoords, cacheCoords);
};

export { toHeading, getFovCone, isWithinRadius, isLookingAtCache, isInClaimCone, FOV_ANGLE, FOV_SIZE, CACHE_CLAIM_TIMER };
