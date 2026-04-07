import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ClaimTimerView = ({ cache, onClaimSuccess, isClaiming }) => {
//   Initialisation -------------
//   State ----------------------

  const [timeLeft, setTimeLeft] = useState(5);

//   Handlers -------------------

  useEffect(() => {
    let timer;
    if (isClaiming && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (isClaiming && timeLeft === 0 && cache) {
      onClaimSuccess(cache.id);
    } else {
      setTimeLeft(5);
    }
    return () => clearTimeout(timer);
  }, [isClaiming, timeLeft, cache, onClaimSuccess]);

//   View -----------------------

  if (!isClaiming) {
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
});

export default ClaimTimerView;
