import {useEffect, useRef, useState} from 'react';
import {isInClaimCone, isWithinRadius} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance) => {
//   State ----------------------

    const [visibleCaches, setVisibleCaches] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const prevIdsRef = useRef('');

//   Handlers -------------------

    useEffect(() => {
        // No location at all — clear everything
        if (!playerLocation) {
            if (prevIdsRef.current !== '') {
                prevIdsRef.current = '';
                setVisibleCaches([]);
                setIsClaiming(false);
            }
            return;
        }

        const hasHeading = playerHeading !== null && playerHeading !== undefined;

        // When heading is available use the full FOV cone check.
        // When heading is NOT available (common on iOS / Apple Maps where the
        // compass may be delayed or unavailable) fall back to proximity-only so
        // iPhone users can still discover and claim caches within range.
        const nearby = (activeCaches || []).filter((cache) =>
            hasHeading
                ? isInClaimCone(playerHeading, playerLocation, cache.coordinates, claimDistance)
                : isWithinRadius(playerLocation, cache.coordinates, claimDistance),
        );

        // Only update state when the set of visible caches actually changes
        const newIds = nearby.map((c) => c.id).join(',');
        if (newIds !== prevIdsRef.current) {
            prevIdsRef.current = newIds;
            setVisibleCaches(nearby);
            setIsClaiming(nearby.length > 0);
        }
    }, [playerLocation, playerHeading, activeCaches, claimDistance]);

//   Return ---------------------

    return {visibleCaches, isClaiming, setIsClaiming};
};

export default usePlayerGame;

