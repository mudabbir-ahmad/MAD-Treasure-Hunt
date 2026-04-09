import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Screen from "../../layout/Screen";
import { Button, ButtonTray } from "../../UI/Button";
import useGlobalHook from "../../../hooks/useGlobalHook";
import { getSession } from "../../../hooks/SessionStore";
import { GAME_MODE } from "../../../utils/gameConstants";

const EMPTY_FORM = {
  UserFirstname: "",
  UserLastname: "",
  UserPhone: "00000",
  UserUsername: "",
  UserImageURL: "",
};

const GlobalProfileScreen = ({ navigation }) => {
  // Initialisations ---------------------

  const session = getSession();
  const {
    getUser,
    updateUser,
    isGlobalApiReady,
    defaultGlobalProfileImageUrl,
  } = useGlobalHook();
  const globalApiRef = useRef({
    getUser,
    updateUser,
    isGlobalApiReady,
  });
  globalApiRef.current = {
    getUser,
    updateUser,
    isGlobalApiReady,
  };

  // State -------------------------------

  const [profile, setProfile] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Handlers ----------------------------

  const hydrateProfile = useCallback(
    async (options = {}) => {
      setIsLoading(true);
      setError("");

      if (session.isBusiness || session.currentGameMode !== GAME_MODE.GLOBAL) {
        navigation.replace("MapScreen");
        return;
      }

      if (!globalApiRef.current.isGlobalApiReady()) {
        setError(
          "Global API URL is not configured yet. Add it in src/components/API/api.json.",
        );
        setIsLoading(false);
        return;
      }

      const globalUserId = session.currentGlobalUserId ?? session.currentUid;
      const latest = await globalApiRef.current.getUser(globalUserId, options);
      if (!latest) {
        setError(
          "Global profile not found. Tap Join Global Game first to initialise it.",
        );
        setIsLoading(false);
        return;
      }

      setProfile({
        UserFirstname: latest.UserFirstname || "",
        UserLastname: latest.UserLastname || "",
        UserPhone: latest.UserPhone || "00000",
        UserUsername: latest.UserUsername || "",
        UserImageURL: latest.UserImageURL || defaultGlobalProfileImageUrl,
      });
      setIsLoading(false);
    },
    [
      defaultGlobalProfileImageUrl,
      navigation,
      session.currentGameMode,
      session.currentGlobalUserId,
      session.currentUid,
      session.isBusiness,
    ],
  );

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  const handleSave = async () => {
    setError("");
    setIsSaving(true);

    const globalUserId = session.currentGlobalUserId ?? session.currentUid;
    const payload = {
      UserID: globalUserId,
      UserFirstname: profile.UserFirstname.trim() || "Global",
      UserLastname: profile.UserLastname.trim() || "User",
      UserPhone: profile.UserPhone.trim() || "00000",
      UserUsername: `${profile.UserFirstname.trim() || "Global"}_${globalUserId}`,
      UserImageURL: profile.UserImageURL.trim() || defaultGlobalProfileImageUrl,
      UserTimestamp: Date.now(),
    };

    const updated = await globalApiRef.current.updateUser(
      globalUserId,
      payload,
    );
    if (!updated) {
      setError("Failed to save profile. Please try again.");
      setIsSaving(false);
      return;
    }

    const latest = await globalApiRef.current.getUser(globalUserId, {
      forceRefresh: true,
    });
    setProfile({
      UserFirstname: latest?.UserFirstname || payload.UserFirstname,
      UserLastname: latest?.UserLastname || payload.UserLastname,
      UserPhone: latest?.UserPhone || payload.UserPhone,
      UserUsername: latest?.UserUsername || payload.UserUsername,
      UserImageURL: latest?.UserImageURL || payload.UserImageURL,
    });
    setIsSaving(false);
  };

  // View --------------------------------

  if (isLoading) {
    return (
      <Screen showBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen showBack>
      <ScrollView contentContainerStyle={styles.container}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: profile.UserImageURL || defaultGlobalProfileImageUrl,
            }}
            style={styles.avatar}
          />
        </View>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="First name"
          placeholderTextColor="#9ca3af"
          value={profile.UserFirstname}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, UserFirstname: value }))
          }
        />

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Last name"
          placeholderTextColor="#9ca3af"
          value={profile.UserLastname}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, UserLastname: value }))
          }
        />

        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="00000"
          placeholderTextColor="#9ca3af"
          value={profile.UserPhone}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, UserPhone: value }))
          }
        />

        <Text style={styles.label}>Profile Image URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/profile.png"
          placeholderTextColor="#9ca3af"
          value={profile.UserImageURL}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, UserImageURL: value }))
          }
          autoCapitalize="none"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={[styles.input, styles.disabledInput]}
          value={profile.UserUsername}
          editable={false}
        />

        <ButtonTray>
          <Button
            label={isSaving ? "Saving..." : "Save Profile"}
            onClick={handleSave}
            disabled={isSaving}
          />
        </ButtonTray>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
    gap: 10,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "#dc2626",
    fontSize: 14,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#111827",
  },
  label: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#45475a",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#cdd6f4",
    backgroundColor: "#313244",
  },
  disabledInput: {
    opacity: 0.7,
  },
});

export default GlobalProfileScreen;
