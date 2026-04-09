import { ScrollView, StyleSheet, Text, View } from "react-native";
import Screen from "../layout/Screen";
import Card from "../UI/Card";
import { Button, ButtonTray } from "../UI/Button";
import { getSession } from "../../hooks/SessionStore";

const GameSelectionScreen = ({ navigation }) => {
  // Initialisations ---------------------

  const session = getSession();
  const isAdmin = Boolean(session.isAcceptedAdmin);

  const privateGames = [
    {
      id: "active-game",
      name: "Private Game",
      players: "4 players",
      endsIn: "Ends in 2h 15m",
    },
  ];

  // State -------------------------------
  // Handlers ----------------------------

  const handleCreateGame = () => {
    if (isAdmin) {
      navigation.navigate("GameSettingsScreen");
      return;
    }
    navigation.navigate("TeamScreen");
  };

  const handleOpenGame = () => {
    navigation.navigate("TeamScreen");
  };

  const handleExplore = () => {
    navigation.navigate("GlobalEventsScreen");
  };

  // View --------------------------------

  return (
    <Screen style={styles.screenContent}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>Your Games</Text>
          <ButtonTray>
            <Button
              label={isAdmin ? "Create Game" : "Manage Team"}
              onClick={handleCreateGame}
              styleButton={styles.primaryButton}
              styleLabel={styles.primaryButtonLabel}
            />
          </ButtonTray>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Private Games</Text>
          {privateGames.map((game) => (
            <Card key={game.id} style={styles.gameCard}>
              <Text style={styles.gameName}>{game.name}</Text>
              <Text style={styles.gameMeta}>{game.players}</Text>
              <Text style={styles.gameMeta}>{game.endsIn}</Text>
              <View style={styles.cardActions}>
                <Button
                  label="Show"
                  onClick={handleOpenGame}
                  styleButton={styles.secondaryButton}
                  styleLabel={styles.secondaryButtonLabel}
                />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Global Mode</Text>
          <Text style={styles.supportText}>
            Explore all visible caches and live activity from the map.
          </Text>
          <ButtonTray>
            <Button
              label="Explore"
              onClick={handleExplore}
              styleButton={styles.neutralButton}
              styleLabel={styles.neutralButtonLabel}
            />
          </ButtonTray>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screenContent: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 28,
  },
  sectionTop: {
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  sectionBlock: {
    marginTop: 8,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  gameCard: {
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderColor: "#d1d5db",
    borderRadius: 10,
  },
  gameName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  gameMeta: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 2,
  },
  cardActions: {
    marginTop: 12,
    maxWidth: 160,
  },
  supportText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 10,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
    flex: 0,
    minHeight: 38,
    paddingHorizontal: 18,
  },
  secondaryButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  neutralButton: {
    backgroundColor: "#374151",
    borderColor: "#374151",
    maxWidth: 180,
  },
  neutralButtonLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
});

export default GameSelectionScreen;
