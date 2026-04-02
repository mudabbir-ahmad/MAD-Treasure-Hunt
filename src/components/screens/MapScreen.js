import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import * as Location from 'expo-location';
import {Magnetometer} from 'expo-sensors';
import Screen from '../layout/Screen';
import PlayerMapView from '../gameplay/PlayerMapView';
import useGameHook from '../../hooks/useGameHook';
import usePlayerGame from '../../hooks/usePlayerGame';
import {getSession} from '../../hooks/SessionStore';
import Cache from '../../models/Cache';

const toHeading = ({ x, y }) => {
  const angle = Math.atan2(y, x) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
};

const MapScreen = () => {
  const session = getSession();
  const { getCaches, claimCache } = useGameHook();
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cacheRecords, setCacheRecords] = useState([]);
  const [error, setError] = useState('');

  const activeCaches = useMemo(() => (
    cacheRecords.map(
      (cache) => new Cache(
        cache.id,
        cache.coordinates.latitude,
        cache.coordinates.longitude,
        cache.radius,
        cache.clue,
        cache.groupId,
        cache.subgroupId,
      ),
    )
  ), [cacheRecords]);

  const subgroupFilter = session.currentSGid;
  const { visibleCache, isClaiming, setIsClaiming } = usePlayerGame(userLocation, heading, activeCaches);

  const loadCaches = useCallback(() => {
    if (!session.currentGid) {
      setCacheRecords([]);
      return;
    }
    const rows = getCaches(session.currentGid, subgroupFilter);
    setCacheRecords(rows);
  }, [getCaches, session.currentGid, subgroupFilter]);

  useEffect(() => {
    loadCaches();
  }, [loadCaches]);

  useEffect(() => {
    let locationSub;
    let headingSub;

    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });

      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 1,
          timeInterval: 1000,
        },
        (next) => {
          setUserLocation({ latitude: next.coords.latitude, longitude: next.coords.longitude });
        },
      );

      Magnetometer.setUpdateInterval(500);
      headingSub = Magnetometer.addListener((data) => {
        setHeading(toHeading(data));
      });

      setLoading(false);
    };

    start();

    return () => {
      if (locationSub) {
        locationSub.remove();
      }
      if (headingSub) {
        headingSub.remove();
      }
    };
  }, []);

  const handleClaim = (cacheId) => {
    if (!session.currentGid) {
      return;
    }
    claimCache({
      gid: session.currentGid,
      cacheId,
      uid: session.currentUid,
      tid: session.currentTid,
    });
    setIsClaiming(false);
    loadCaches();
  };

  if (!session.currentGid) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.body}>Join or create a game to use map features.</Text>
      </Screen>
    );
  }

  if (session.isAcceptedAdmin) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.body}>Admins manage caches from Manage Game.</Text>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.mapWrap}>
        <PlayerMapView
          userLocation={userLocation}
          visibleCache={visibleCache}
          isClaiming={isClaiming}
          onClaimSuccess={handleClaim}
        />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  mapWrap: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    color: '#4b5563',
    fontSize: 15,
  },
  error: {
    color: '#dc2626',
    fontSize: 15,
  },
});

export default MapScreen;
