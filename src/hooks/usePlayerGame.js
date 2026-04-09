import {useEffect, useRef, useState} from 'react';
import {isInClaimCone} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance, selectedCacheId) => {
//   State ----------------------

    const [visibleCaches, setVisibleCaches] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const prevIdsRef = useRef('');

//   Handlers -------------------

    // Determine which caches fall inside the FOV claim cone
    useEffect(() => {
        if (!playerLocation || playerHeading === null || playerHeading === undefined) {
            if (prevIdsRef.current !== '') {
                prevIdsRef.current = '';
                setVisibleCaches([]);
            }
            return;
        }

        const inCone = (activeCaches || []).filter((cache) =>
            isInClaimCone(playerHeading, playerLocation, cache.coordinates, claimDistance),
        );

        // Only update state when the set of visible caches actually changes
        const newIds = inCone.map((c) => c.id).join(',');
        if (newIds !== prevIdsRef.current) {
            prevIdsRef.current = newIds;
            setVisibleCaches(inCone);
        }
    }, [playerLocation, playerHeading, activeCaches, claimDistance]);

    // Claiming requires ALL four criteria:
    // 1. Cache not already claimed by player's team  (handled by activeCaches filter)
    // 2. Cache within claim distance                  (handled by isInClaimCone)
    // 3. Player looking at the cache (in FOV cone)    (handled by isInClaimCone)
    // 4. Cache is the one currently selected in list  (checked here)
    useEffect(() => {
        const canClaim = Boolean(
            selectedCacheId && visibleCaches.some((c) => c.id === selectedCacheId),
        );
        setIsClaiming(canClaim);
    }, [visibleCaches, selectedCacheId]);

//   Return ---------------------

    return {visibleCaches, isClaiming, setIsClaiming};
};

export default usePlayerGame;

