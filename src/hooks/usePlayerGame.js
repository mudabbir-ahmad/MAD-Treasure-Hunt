import {useEffect, useState} from 'react';
import {isInClaimCone} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance) => {
//   State ----------------------

    const [visibleCache, setVisibleCache] = useState(null);
    const [isClaiming, setIsClaiming] = useState(false);

//   Handlers -------------------

    useEffect(() => {
        if (!playerLocation || playerHeading === null || playerHeading === undefined) {
            setVisibleCache(null);
            setIsClaiming(false);
            return;
        }

        // Find the first cache that falls inside the invisible claim cone
        // (same FOV angle as the visible cone, but radius = admin-set claimDistance)
        const cacheInCone = (activeCaches || []).find((cache) =>
            isInClaimCone(playerHeading, playerLocation, cache.coordinates, claimDistance)
        );

        setVisibleCache(cacheInCone || null);
        setIsClaiming(Boolean(cacheInCone));
    }, [playerLocation, playerHeading, activeCaches, claimDistance]);

//   Return ---------------------

    return {visibleCache, isClaiming, setIsClaiming};
};

export default usePlayerGame;

