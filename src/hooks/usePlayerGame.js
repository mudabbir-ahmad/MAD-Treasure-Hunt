import {useEffect, useRef, useState} from 'react';
import {isInClaimCone} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance, selectedCacheId) => {
    const [visibleCaches, setVisibleCaches] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const prevIdRef = useRef('');

    useEffect(() => {
        if (!playerLocation || playerHeading === null || playerHeading === undefined || !selectedCacheId) {
            if (prevIdRef.current !== '') {
                prevIdRef.current = '';
                setVisibleCaches([]);
                setIsClaiming(false);
            }
            return;
        }

        const caches = activeCaches || [];
        let selected = selectedCacheId ? caches.find((c) => c.id === selectedCacheId) : null;
        let visible = selected && isInClaimCone(playerHeading, playerLocation, selected.coordinates, claimDistance);

        if (!visible) {
            selected = caches.find((c) => isInClaimCone(playerHeading, playerLocation, c.coordinates, claimDistance)) || null;
            visible = Boolean(selected);
        }

        const newId = visible ? String(selected.id) : '';

        if (newId !== prevIdRef.current) {
            prevIdRef.current = newId;
            setVisibleCaches(visible ? [selected] : []);
            setIsClaiming(Boolean(visible));
        }
    }, [playerLocation, playerHeading, activeCaches, claimDistance, selectedCacheId]);

    return {visibleCaches, isClaiming, setIsClaiming};
};

export default usePlayerGame;



