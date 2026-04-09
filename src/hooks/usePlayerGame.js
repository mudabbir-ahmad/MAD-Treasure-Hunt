import {useEffect, useRef, useState} from 'react';
import {isInClaimCone} from '../utils/geoMath';

const usePlayerGame = (playerLocation, playerHeading, activeCaches, claimDistance, selectedCacheId, preferSelectedCache = true) => {
    const [visibleCaches, setVisibleCaches] = useState([]);
    const [isClaiming, setIsClaiming] = useState(false);
    const prevIdRef = useRef('');

    useEffect(() => {
        if (!playerLocation || playerHeading === null || playerHeading === undefined) {
            if (prevIdRef.current !== '') {
                prevIdRef.current = '';
                setVisibleCaches([]);
                setIsClaiming(false);
            }
            return;
        }

        const caches = activeCaches || [];
        let selected = (preferSelectedCache && selectedCacheId)
            ? caches.find((c) => c.id === selectedCacheId)
            : null;
        let visible = selected && isInClaimCone(playerHeading, playerLocation, selected.coordinates, claimDistance);

        if (!preferSelectedCache && !visible) {
            selected = caches.find((c) => isInClaimCone(playerHeading, playerLocation, c.coordinates, claimDistance)) || null;
            visible = Boolean(selected);
        }

        const newId = visible ? String(selected.id) : '';

        if (newId !== prevIdRef.current) {
            prevIdRef.current = newId;
            setVisibleCaches(visible ? [selected] : []);
            setIsClaiming(Boolean(visible));
        } else if (!visible && prevIdRef.current !== '') {
            prevIdRef.current = '';
            setVisibleCaches([]);
            setIsClaiming(false);
        }
    }, [playerLocation, playerHeading, activeCaches, claimDistance, selectedCacheId, preferSelectedCache]);

    return {visibleCaches, isClaiming, setIsClaiming};
};

export default usePlayerGame;



