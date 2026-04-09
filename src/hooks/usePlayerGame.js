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

        const selected = (activeCaches || []).find((c) => c.id === selectedCacheId);
        const visible = selected && isInClaimCone(playerHeading, playerLocation, selected.coordinates, claimDistance);
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



