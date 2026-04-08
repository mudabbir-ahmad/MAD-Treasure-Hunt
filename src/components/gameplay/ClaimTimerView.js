import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {CACHE_CLAIM_TIMER} from '../../utils/geoMath';

const ClaimTimerView = ({ cache, onClaimSuccess, isClaiming, showClaimedPopup }) => {
//   Initialisation -------------
//   State ----------------------

  const [timeLeft, setTimeLeft] = useState(CACHE_CLAIM_TIMER);
  // Use a ref for the callback so it does not appear in the dependency array
  const onClaimRef = useRef(onClaimSuccess);
  onClaimRef.current = onClaimSuccess;

//   Handlers -------------------

  useEffect(() => {
    let timer;
    if (isClaiming && cache && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isClaiming && timeLeft === 0 && cache) {
      onClaimRef.current(cache.id);
    } else if (!isClaiming) {
      setTimeLeft(CACHE_CLAIM_TIMER);
    }
    return () => clearTimeout(timer);
  }, [isClaiming, timeLeft, cache]);

//   View -----------------------

  // Show "Cache Claimed!" popup after a successful claim
  if (showClaimedPopup) {
    return (
      <View style={styles.claimedOverlay}>
        <Text style={styles.claimedText}>Cache Claimed!</Text>
      </View>
    );
  }

  if (!isClaiming || !cache) {
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  claimedOverlay: {
    alignSelf: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  claimedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ClaimTimerView;
