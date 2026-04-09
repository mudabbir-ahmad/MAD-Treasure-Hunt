import {useCallback, useEffect, useRef, useState} from "react";
import {ActivityIndicator, StyleSheet, Text, View} from "react-native";
import Screen from "../../layout/Screen";
import {Button, ButtonTray} from "../../UI/Button";
import EventList from "../../../entity/event/EventList";
import useGlobalHook from "../../../hooks/useGlobalHook";
import {getSession, setGlobalSession} from "../../../hooks/SessionStore";
import {GAME_MODE} from "../../../utils/gameConstants";

const GlobalEventsScreen = ({ navigation }) => {
  // Initialisations ---------------------

  const { getPublicEvents, getPlayersByEvent, joinEvent, isGlobalApiReady } =
    useGlobalHook();
  const session = getSession();
  const globalApiRef = useRef({
    getPublicEvents,
    getPlayersByEvent,
    joinEvent,
    isGlobalApiReady,
  });
  globalApiRef.current = {
    getPublicEvents,
    getPlayersByEvent,
    joinEvent,
    isGlobalApiReady,
  };

  // State -------------------------------

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(null);

  // Handlers ----------------------------

  const loadEvents = useCallback(async (options = {}) => {
    setIsLoading(true);
    setError("");

    if (!globalApiRef.current.isGlobalApiReady()) {
      setEvents([]);
      setError(
        "Global API URL is not configured yet. Add it in src/components/API/api.json.",
      );
      setIsLoading(false);
      return;
    }

    const data = await globalApiRef.current.getPublicEvents(options);
    setEvents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (session.isBusiness || session.currentGameMode !== GAME_MODE.GLOBAL) {
      navigation.replace("MapScreen");
      return;
    }
    loadEvents();
  }, [loadEvents, navigation, session.currentGameMode, session.isBusiness]);

  const handleSelect = async (event) => {
    setError("");
    setJoining(event.EventID);

    if (!globalApiRef.current.isGlobalApiReady()) {
      setError(
        "Global API URL is not configured yet. Add it in src/components/API/api.json.",
      );
      setJoining(null);
      return;
    }

    const globalUserId = session.currentGlobalUserId ?? session.currentUid;

    const pickPlayerId = (player) => {
      if (!player) return null;
      const id = player.PlayerID ?? player.playerId ?? null;
      return id !== undefined && id !== null ? id : null;
    };

    // Check if already a player
    const players = await globalApiRef.current.getPlayersByEvent(
      event.EventID,
      { forceRefresh: true },
    );
    const existing = (players || []).find(
      (p) => String(p.PlayerUserID) === String(globalUserId),
    );

    const existingPlayerId = pickPlayerId(existing);
    if (existingPlayerId !== null) {
      setGlobalSession(event.EventID, existingPlayerId);
      navigation.navigate("GlobalMapScreen", {
        eventId: event.EventID,
        event,
      });
      setJoining(null);
      return;
    }

    // Join the event
    const player = await globalApiRef.current.joinEvent({
      PlayerUserID: globalUserId,
      PlayerEventID: event.EventID,
    });

    const joinedPlayerId = pickPlayerId(player);
    if (joinedPlayerId !== null) {
      setGlobalSession(event.EventID, joinedPlayerId);
      navigation.navigate("GlobalMapScreen", {
        eventId: event.EventID,
        event,
      });
      setJoining(null);
      return;
    }

    // If create fails due duplicate race/server behavior, recover by re-reading players.
    const refreshedPlayers = await globalApiRef.current.getPlayersByEvent(
      event.EventID,
      { forceRefresh: true },
    );
    const recovered = (refreshedPlayers || []).find(
      (p) => String(p.PlayerUserID) === String(globalUserId),
    );
    const recoveredPlayerId = pickPlayerId(recovered);
    if (recoveredPlayerId !== null) {
      setGlobalSession(event.EventID, recoveredPlayerId);
      navigation.navigate("GlobalMapScreen", {
        eventId: event.EventID,
        event,
      });
    } else {
      setError("Failed to join event. Please try again.");
    }

    setJoining(null);
  };

  // View --------------------------------

  return (
    <Screen>
      <View style={styles.container}>
        <ButtonTray>
          <Button
            label="Refresh"
            onClick={() => loadEvents({ forceRefresh: true })}
          />
        </ButtonTray>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading public events…</Text>
          </View>
        ) : events.length === 0 ? (
          <Text style={styles.empty}>No public events available.</Text>
        ) : (
          <>
            <Text style={styles.hint}>
              Tap an event to join and explore its caches.
            </Text>
            <EventList events={events} onSelect={handleSelect} />
          </>
        )}

        {joining !== null && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#a6adc8",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    color: "#a6adc8",
    marginTop: 30,
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    color: "#a6adc8",
  },
  error: {
    color: "#f38ba8",
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default GlobalEventsScreen;
