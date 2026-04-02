import {useEffect, useState} from 'react';
import {isLookingAtCache, isWithinRadius} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches) => {
  const [visibleCache, setVisibleCache] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!playerLocation || playerHeading === null || playerHeading === undefined) {
      setVisibleCache(null);
      setIsClaiming(false);
      return;
    }

    const nearbyCache = (activeCaches || []).find((cache) =>
      isWithinRadius(playerLocation, cache.coordinates, cache.radius));

    if (!nearbyCache) {
      setVisibleCache(null);
      setIsClaiming(false);
      return;
    }

    const isTargeted = isLookingAtCache(
      playerHeading,
      playerLocation,
      nearbyCache.coordinates,
    );

    setVisibleCache(nearbyCache);
    setIsClaiming(isTargeted);
  }, [playerLocation, playerHeading, activeCaches]);

  return { visibleCache, isClaiming, setIsClaiming };
};

export default usePlayerGame;

