import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CACHE_CLAIM_TIMER} from '../../utils/geoMath';

const ClaimTimerView = ({
  cache,
  onClaimSuccess,
  isClaiming,
  showClaimedPopup,
  claimDurationSeconds = CACHE_CLAIM_TIMER,
  claimedPopupMessage = 'Cache Claimed!',
  autoClaim = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(claimDurationSeconds);
  const onClaimRef = useRef(onClaimSuccess);
  const hasClaimedRef = useRef(false);
  onClaimRef.current = onClaimSuccess;

  useEffect(() => {
    setTimeLeft(claimDurationSeconds);
    hasClaimedRef.current = false;
  }, [cache?.id, claimDurationSeconds]);

  useEffect(() => {
    let timer;

    if (!isClaiming || !cache) {
      if (!isClaiming) {
        setTimeLeft(claimDurationSeconds);
        hasClaimedRef.current = false;
      }
      return () => clearTimeout(timer);
    }

    if (!autoClaim) {
      return () => clearTimeout(timer);
    }

    if (claimDurationSeconds <= 0) {
      if (!hasClaimedRef.current) {
        hasClaimedRef.current = true;
        onClaimRef.current(cache.id);
      }
      return () => clearTimeout(timer);
    }

    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (!hasClaimedRef.current) {
      hasClaimedRef.current = true;
      onClaimRef.current(cache.id);
    }

    return () => clearTimeout(timer);
  }, [autoClaim, claimDurationSeconds, cache, isClaiming, timeLeft]);

  if (showClaimedPopup) {
    return (
      <View style={styles.claimedOverlay}>
        <Text style={styles.claimedText}>{claimedPopupMessage}</Text>
      </View>
    );
  }

  if (!isClaiming || !cache || claimDurationSeconds <= 0) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Text style={styles.text}>Hold steady. Claiming in {timeLeft}...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  text: {
    color: '#cdd6f4',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedOverlay: {
    alignSelf: 'center',
    backgroundColor: '#a6e3a1',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  claimedText: {
    color: '#1e1e2e',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ClaimTimerView;
