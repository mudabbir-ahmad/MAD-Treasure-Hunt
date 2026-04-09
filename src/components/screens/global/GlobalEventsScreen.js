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

  const { getPublicEvents, getPlayersByEvent, joinEvent } = useGlobalHook();
  const session = getSession();
  const globalApiRef = useRef({
    getPublicEvents,
    getPlayersByEvent,
    joinEvent,
  });
  globalApiRef.current = {
    getPublicEvents,
    getPlayersByEvent,
    joinEvent,
  };

  // State -------------------------------

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(null);

  // Handlers ----------------------------

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const data = await globalApiRef.current.getPublicEvents();
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

    // Check if already a player
    const players = await globalApiRef.current.getPlayersByEvent(event.EventID);
    const existing = (players || []).find(
      (p) => p.PlayerUserID === session.currentUid,
    );

    if (existing) {
      setGlobalSession(event.EventID, existing.PlayerID);
      navigation.navigate("GlobalMapScreen", { eventId: event.EventID });
    } else {
      // Join the event
      const player = await globalApiRef.current.joinEvent({
        PlayerUserID: session.currentUid,
        PlayerEventID: event.EventID,
      });
      if (player) {
        setGlobalSession(event.EventID, player.PlayerID);
        navigation.navigate("GlobalMapScreen", { eventId: event.EventID });
      } else {
        setError("Failed to join event. Please try again.");
      }
    }

    setJoining(null);
  };

  // View --------------------------------

  return (
    <Screen>
      <View style={styles.container}>
        <ButtonTray>
          <Button label="Refresh" onClick={loadEvents} />
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
    color: "#6b7280",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 30,
    fontSize: 15,
  },
  hint: {
    fontSize: 13,
    color: "#6b7280",
  },
  error: {
    color: "#dc2626",
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
