import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import * as Location from 'expo-location';
import Screen from '../layout/Screen';
import AdminCacheEditorView from '../gameplay/AdminCacheEditorView';
import useGameHook from '../../hooks/useGameHook';
import {getSession} from '../../hooks/SessionStore';

const ManageGameScreen = () => {
  const session = getSession();
  const { getCaches, upsertCache } = useGameHook();
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cacheRecords, setCacheRecords] = useState([]);

  const loadCaches = useCallback(async () => {
    if (!session.currentGid) {
      setCacheRecords([]);
      return;
    }
    const rows = await getCaches(session.currentGid, null);
    setCacheRecords(rows || []);
  }, [getCaches, session.currentGid]);

  useEffect(() => {
    loadCaches();
  }, [loadCaches]);

  useEffect(() => {
    let locationSub;

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

      setLoading(false);
    };

    start();

    return () => {
      if (locationSub) {
        locationSub.remove();
      }
    };
  }, []);

  const handleAddCache = async (coordinate) => {
    if (!session.currentGid) {
      return;
    }
    await upsertCache({
      gid: session.currentGid,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radius: 20,
      clue: `Cache ${cacheRecords.length + 1}`,
      subgroupId: 1,
    });
    await loadCaches();
  };

  const handleMoveCache = async (cacheId, coordinate) => {
    if (!session.currentGid) {
      return;
    }
    const current = cacheRecords.find((cache) => cache.id === cacheId);
    if (!current) {
      return;
    }
    await upsertCache({
      gid: session.currentGid,
      cacheId,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      radius: current.radius,
      clue: current.clue,
      subgroupId: current.subgroupId,
    });
    await loadCaches();
  };

  if (!session.currentGid) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.body}>Create or join a game first.</Text>
      </Screen>
    );
  }

  if (!session.isAcceptedAdmin) {
    return (
      <Screen style={styles.center}>
        <Text style={styles.body}>Only admins can edit cache locations.</Text>
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
        <AdminCacheEditorView
          userLocation={userLocation}
          caches={cacheRecords}
          onAddCache={handleAddCache}
          onMoveCache={handleMoveCache}
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

export default ManageGameScreen;
