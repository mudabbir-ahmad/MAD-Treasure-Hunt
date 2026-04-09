import {useEffect, useRef, useState} from 'react';
import {isInClaimCone} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance) => {
//   State ----------------------

    const [visibleCaches, setVisibleCaches] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const prevIdsRef = useRef('');

//   Handlers -------------------

    useEffect(() => {
        // Both location AND heading are required — the player must physically
        // point their device towards a cache to trigger the claim countdown
        if (!playerLocation || playerHeading === null || playerHeading === undefined) {
            if (prevIdsRef.current !== '') {
                prevIdsRef.current = '';
                setVisibleCaches([]);
                setIsClaiming(false);
            }
            return;
        }

        // Find all caches that fall inside the claim cone
        const inCone = (activeCaches || []).filter((cache) =>
            isInClaimCone(playerHeading, playerLocation, cache.coordinates, claimDistance),
        );

        // Only update state when the set of visible caches actually changes
        const newIds = inCone.map((c) => c.id).join(',');
        if (newIds !== prevIdsRef.current) {
            prevIdsRef.current = newIds;
            setVisibleCaches(inCone);
            setIsClaiming(inCone.length > 0);
        }
    }, [playerLocation, playerHeading, activeCaches, claimDistance]);

//   Return ---------------------

    return {visibleCaches, isClaiming, setIsClaiming};
};

export default usePlayerGame;

