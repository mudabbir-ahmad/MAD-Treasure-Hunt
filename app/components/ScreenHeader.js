import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter, useSegments} from 'expo-router';
import {getSession, setSessionGroup, setSessionTeam, setSessionUser} from '../Model/SessionStore';

const ScreenHeader = ({ title, showBack = true }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const session = getSession();

  // Check if user is logged in by checking if currentUid exists
  const isLoggedIn = Boolean(session.currentUid);

  // Pages where back navigation should be disabled
  const blockedLastSegments = ['login', 'register', 'index'];

  // compute last meaningful segment (filter out route groups like "(routes)")
  const meaningfulSegments = segments.filter((s) => !s.startsWith('('));
  const lastSegment = meaningfulSegments.length > 0 ? meaningfulSegments[meaningfulSegments.length - 1] : 'index';
  const isBlocked = blockedLastSegments.includes(lastSegment);


  const handleBack = () => {
    if (isBlocked || !showBack) return;
    try {
      router.back();
    } catch {
      // fallback: nothing
    }
  };

  const handleLogout = () => {
    // clear session and route to login (replace so user cannot go back)
    try {
      setSessionUser(null);
      setSessionGroup(null);
      setSessionTeam(null);
    } catch {
      // ignore
    }
    try {
      router.replace('/login');
    } catch {
      // noop
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      {showBack && !isBlocked ? (
        <Pressable style={styles.backButton} onPress={handleBack} accessibilityLabel="Go back">
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      {isLoggedIn ? (
        <Pressable style={styles.backButton} onPress={handleLogout} accessibilityLabel="Logout">
          <Text style={styles.backText}>⎋</Text>
        </Pressable>
      ) : (
        <View style={styles.backButtonPlaceholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 22,
  },
  backButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  rightPlaceholder: {
    width: 44,
    height: 44,
  },
});

export default ScreenHeader;

