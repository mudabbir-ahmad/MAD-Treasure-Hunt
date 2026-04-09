import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import Screen from "../../layout/Screen";
import { Button, ButtonTray } from "../../UI/Button";
import CacheList from "../../../entity/cache/CacheList";
import useGlobalHook from "../../../hooks/useGlobalHook";
import { getSession } from "../../../hooks/SessionStore";

const DEFAULT_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const GlobalMapScreen = ({ navigation, route }) => {
  // Initialisations ---------------------

  const { eventId } = route.params;
  const { getCachesByEvent, getFindsByPlayer } = useGlobalHook();
  const session = getSession();

  // State -------------------------------

  const [caches, setCaches] = useState([]);
  const [foundCacheIds, setFoundCacheIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [error, setError] = useState("");

  // Handlers ----------------------------

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const [cacheData, findsData] = await Promise.all([
      getCachesByEvent(eventId),
      session.currentGlobalPlayerId
        ? getFindsByPlayer(session.currentGlobalPlayerId)
        : Promise.resolve([]),
    ]);

    setCaches(cacheData);
    setFoundCacheIds((findsData || []).map((f) => f.FindCacheID));
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let sub;
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }

      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        setUserLocation({
          latitude: last.coords.latitude,
          longitude: last.coords.longitude,
        });
      } else {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: 3000,
        },
        (pos) =>
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
      );
    };
    start();
    return () => {
      if (sub) sub.remove();
    };
  }, []);

  const mapRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  const handleCacheSelect = (cache) => {
    navigation.navigate("GlobalCacheViewScreen", {
      cache,
      isFound: foundCacheIds.includes(cache.CacheID),
      onFindLogged: loadData,
    });
  };

  const handleGotoLeaderboard = () => {
    navigation.navigate("GlobalLeaderboardScreen", { eventId });
  };

  // View --------------------------------

  if (isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator size="large" />
      </Screen>
    );
  }

  return (
    <Screen showBack>
      <View style={styles.container}>
        {/* Tab switcher */}
        <View style={styles.tabs}>
          <TabButton
            label="Map"
            active={activeTab === "map"}
            onPress={() => setActiveTab("map")}
          />
          <TabButton
            label="List"
            active={activeTab === "list"}
            onPress={() => setActiveTab("list")}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {activeTab === "map" ? (
          <MapView style={styles.map} region={mapRegion} showsUserLocation>
            {caches.map((cache) => {
              const found = foundCacheIds.includes(cache.CacheID);
              return (
                <Marker
                  key={cache.CacheID}
                  coordinate={{
                    latitude: cache.CacheLatitude,
                    longitude: cache.CacheLongitude,
                  }}
                  title={cache.CacheName}
                  description={`${cache.CachePoints ?? 0} pts${found ? " · Found" : ""}`}
                  pinColor={found ? "#22c55e" : "#ef4444"}
                  onCalloutPress={() => handleCacheSelect(cache)}
                />
              );
            })}
          </MapView>
        ) : (
          <CacheList
            caches={caches}
            foundCacheIds={foundCacheIds}
            onSelect={handleCacheSelect}
          />
        )}

        <ButtonTray>
          <Button label="Leaderboard" onClick={handleGotoLeaderboard} />
          <Button label="Refresh" onClick={loadData} />
        </ButtonTray>
      </View>
    </Screen>
  );
};

const TabButton = ({ label, active, onPress }) => (
  <Text
    onPress={onPress}
    style={[tabStyles.tab, active && tabStyles.activeTab]}
  >
    {label}
  </Text>
);

const tabStyles = StyleSheet.create({
  tab: {
    flex: 1,
    textAlign: "center",
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    color: "#111827",
    borderBottomColor: "#111827",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 10,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  map: {
    flex: 1,
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
  },
});

export default GlobalMapScreen;
