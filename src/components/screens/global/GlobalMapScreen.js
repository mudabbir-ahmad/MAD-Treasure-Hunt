import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ActivityIndicator, StyleSheet, Text, View} from "react-native";
import MapView, {Circle, Marker, Polygon} from "react-native-maps";
import * as Location from "expo-location";
import Screen from "../../layout/Screen";
import {Button, ButtonTray} from "../../UI/Button";
import ClaimTimerView from "../../gameplay/ClaimTimerView";
import CacheList from "../../../entity/cache/CacheList";
import useGlobalHook from "../../../hooks/useGlobalHook";
import usePlayerGame from "../../../hooks/usePlayerGame";
import {getSession} from "../../../hooks/SessionStore";
import {getFovCone, isInClaimCone} from "../../../utils/geoMath";
import {GAME_MODE} from "../../../utils/gameConstants";

const DEFAULT_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const GLOBAL_CLAIM_DISTANCE_METERS = 50;

const GlobalMapScreen = ({ navigation, route }) => {
  // Initialisations ---------------------

  const session = getSession();
  const routeEvent = route?.params?.event ?? null;
  const eventId =
    route?.params?.eventId ?? routeEvent?.EventID ?? session.currentGlobalEventId;
  const { getCachesByEvent, getFindsByPlayer, logFind } = useGlobalHook();
  const globalApiRef = useRef({
    getCachesByEvent,
    getFindsByPlayer,
    logFind,
  });
  globalApiRef.current = {
    getCachesByEvent,
    getFindsByPlayer,
    logFind,
  };

  // State -------------------------------

  const [caches, setCaches] = useState([]);
  const [foundCacheIds, setFoundCacheIds] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("map");
  const [error, setError] = useState("");
  const [selectedCacheId, setSelectedCacheId] = useState(
    route?.params?.selectedCacheId ?? route?.params?.cache?.CacheID ?? null,
  );
  const [claimedPopupVisible, setClaimedPopupVisible] = useState(false);
  const [claimedPopupMessage, setClaimedPopupMessage] = useState("Cache Claimed!");

  const claimableCaches = useMemo(
    () =>
      (caches || [])
        .filter((cache) => !foundCacheIds.includes(String(cache.CacheID)))
        .map((cache) => ({
          id: cache.CacheID,
          clue: cache.CacheClue || cache.CacheName,
          name: cache.CacheName,
          coordinates: {
            latitude: cache.CacheLatitude,
            longitude: cache.CacheLongitude,
          },
          raw: cache,
        })),
    [caches, foundCacheIds],
  );

  const { visibleCaches, isClaiming, setIsClaiming } = usePlayerGame(
    userLocation,
    heading,
    claimableCaches,
    GLOBAL_CLAIM_DISTANCE_METERS,
    selectedCacheId,
    false,
  );

  // Handlers ----------------------------

  const loadData = useCallback(
    async (options = {}) => {
      if (!eventId) return;

      setIsLoading(true);
      setError("");

      const [cacheData, findsData] = await Promise.all([
        globalApiRef.current.getCachesByEvent(eventId, options),
        session.currentGlobalPlayerId
          ? globalApiRef.current.getFindsByPlayer(
              session.currentGlobalPlayerId,
              options,
            )
          : Promise.resolve([]),
      ]);

      setCaches(cacheData || []);
      setFoundCacheIds((findsData || []).map((f) => String(f.FindCacheID)));
      setIsLoading(false);
    },
    [eventId, session.currentGlobalPlayerId],
  );

  const handleClaim = useCallback(
    async (cacheId) => {
      if (!session.currentGlobalPlayerId) {
        setIsClaiming(false);
        return;
      }

      const alreadyFound = foundCacheIds.some(
        (id) => String(id) === String(cacheId),
      );
      if (alreadyFound) {
        setIsClaiming(false);
        return;
      }

      const claimedCache = (caches || []).find(
        (cache) => String(cache.CacheID) === String(cacheId),
      );

      const result = await globalApiRef.current.logFind({
        FindPlayerID: session.currentGlobalPlayerId,
        FindCacheID: claimedCache?.CacheID ?? cacheId,
        FindDatetime: new Date().toISOString(),
      });

      setIsClaiming(false);

      if (result) {
        const cacheName = claimedCache?.CacheName || "Cache";
        const points = Number(claimedCache?.CachePoints ?? 0);
        setClaimedPopupMessage(`${cacheName} claimed! You gained +${points} points.`);
        setClaimedPopupVisible(true);
        setTimeout(() => setClaimedPopupVisible(false), 3000);
        await loadData({ forceRefresh: true });
      }
    },
    [caches, foundCacheIds, loadData, session.currentGlobalPlayerId, setIsClaiming],
  );

  const handleCacheSelect = (cache) => {
    setSelectedCacheId(cache.CacheID);
    setActiveTab("map");
  };

  const resolveClaimTarget = useCallback(() => {
    if (!userLocation || heading === null || heading === undefined) {
      return null;
    }

    return (
      claimableCaches.find((cache) =>
        isInClaimCone(
          heading,
          userLocation,
          cache.coordinates,
          GLOBAL_CLAIM_DISTANCE_METERS,
        ),
      ) || null
    );
  }, [claimableCaches, heading, userLocation]);

  const handleOpenSelectedCache = () => {
    const selected = (caches || []).find(
      (cache) => cache.CacheID === selectedCacheId,
    );
    if (!selected) return;
    navigation.navigate("GlobalCacheViewScreen", {
      cache: selected,
      event: routeEvent,
      eventId,
      isFound: foundCacheIds.includes(String(selected.CacheID)),
    });
  };

  useEffect(() => {
    if (session.isBusiness || session.currentGameMode !== GAME_MODE.GLOBAL) {
      navigation.replace("MapScreen");
      return;
    }

    if (!session.currentGlobalPlayerId) {
      navigation.replace("GlobalEventsScreen");
      return;
    }

    if (!eventId) {
      navigation.replace("GlobalEventsScreen");
    }
  }, [
    eventId,
    navigation,
    session.currentGameMode,
    session.currentGlobalPlayerId,
    session.isBusiness,
  ]);

  useEffect(() => {
    if (
      !eventId ||
      session.currentGameMode !== GAME_MODE.GLOBAL ||
      !session.currentGlobalPlayerId
    ) {
      return;
    }

    loadData();
  }, [
    eventId,
    loadData,
    session.currentGameMode,
    session.currentGlobalPlayerId,
  ]);

  useEffect(() => {
    const routeSelected = route?.params?.selectedCacheId;
    if (!routeSelected) return;
    setSelectedCacheId(routeSelected);
  }, [route?.params?.selectedCacheId]);

  useEffect(() => {
    if (route?.params?.cache?.CacheID) {
      setSelectedCacheId(route.params.cache.CacheID);
    }
  }, [route?.params?.cache?.CacheID]);

  useEffect(() => {
    if (selectedCacheId) return;
    setSelectedCacheId(route?.params?.cache?.CacheID ?? claimableCaches[0]?.id ?? null);
  }, [claimableCaches, route?.params?.cache?.CacheID, selectedCacheId]);

  useEffect(() => {
    let locationSub;
    let headingSub;

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

      locationSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 3,
          timeInterval: 1500,
        },
        (pos) =>
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
      );

      headingSub = await Location.watchHeadingAsync((headingData) => {
        const raw =
          headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading;
        setHeading(raw);
      });
    };

    start();

    return () => {
      if (locationSub) locationSub.remove();
      if (headingSub) headingSub.remove();
    };
  }, []);

  const mapRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  const claimTarget = resolveClaimTarget() || visibleCaches[0] || null;

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
          <MapView
            style={styles.map}
            provider="google"
            region={mapRegion}
            showsUserLocation
          >
            {(caches || []).map((cache) => {
              const found = foundCacheIds.includes(String(cache.CacheID));
              const selected = selectedCacheId === cache.CacheID;
              return (
                <Marker
                  key={cache.CacheID}
                  coordinate={{
                    latitude: cache.CacheLatitude,
                    longitude: cache.CacheLongitude,
                  }}
                  title={cache.CacheName}
                  description={`${cache.CachePoints ?? 0} pts${found ? " · Found" : ""}`}
                  pinColor={
                    found ? "#22c55e" : selected ? "#f59e0b" : "#ef4444"
                  }
                  onPress={() => setSelectedCacheId(cache.CacheID)}
                  onCalloutPress={() =>
                    navigation.navigate("GlobalCacheViewScreen", {
                      cache,
                      event: routeEvent,
                      eventId,
                      isFound: found,
                    })
                  }
                />
              );
            })}

            {claimTarget ? (
              <Circle
                center={claimTarget.coordinates}
                radius={GLOBAL_CLAIM_DISTANCE_METERS}
                fillColor="rgba(245, 158, 11, 0.12)"
                strokeColor="rgba(245, 158, 11, 0.8)"
              />
            ) : null}

            {userLocation && heading !== null && heading !== undefined ? (
              <Polygon
                coordinates={getFovCone(userLocation, heading)}
                fillColor="rgba(66,133,244,0.28)"
                strokeColor="rgba(66,133,244,0.50)"
                strokeWidth={1}
              />
            ) : null}
          </MapView>
        ) : (
          <CacheList
            caches={caches}
            foundCacheIds={foundCacheIds}
            onSelect={handleCacheSelect}
          />
        )}

        <ClaimTimerView
          cache={claimTarget}
          isClaiming={isClaiming}
          onClaimSuccess={handleClaim}
          showClaimedPopup={claimedPopupVisible}
          claimDurationSeconds={0}
          claimedPopupMessage={claimedPopupMessage}
          autoClaim={false}
        />

        <ButtonTray>
          <Button
            label="Details"
            onClick={handleOpenSelectedCache}
            disabled={!selectedCacheId}
          />
          <Button
            label="Claim Cache"
            onClick={() => {
              const target = resolveClaimTarget();
              if (target) {
                setSelectedCacheId(target.id);
                handleClaim(target.id);
              }
            }}
            disabled={!resolveClaimTarget() || !session.currentGlobalPlayerId}
          />
          <Button
            label="Refresh"
            onClick={() => loadData({ forceRefresh: true })}
          />
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
    color: "#a6adc8",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    color: "#cdd6f4",
    borderBottomColor: "#89b4fa",
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
    borderBottomColor: "#45475a",
  },
  map: {
    flex: 1,
  },
  error: {
    color: "#f38ba8",
    fontSize: 14,
  },
});

export default GlobalMapScreen;
