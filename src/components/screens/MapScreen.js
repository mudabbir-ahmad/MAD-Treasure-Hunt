import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import * as Location from 'expo-location';
import {Magnetometer} from 'expo-sensors';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import PlayerMapView from '../gameplay/PlayerMapView';
import useGameHook from '../../hooks/useGameHook';
import usePlayerGame from '../../hooks/usePlayerGame';
import {getSession, setSessionGroup, setSessionUser} from '../../hooks/SessionStore';

const toHeading = ({x, y}) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
};

const MapScreen = ({navigation}) => {
//   Initialisation ------------

    const session = getSession();
    const {getCaches, claimCache, joinPrivateGame, createPrivateGame, getLobby, getUser} = useGameHook();

//   State ----------------------

    const [inGame, setInGame] = useState(Boolean(session.currentGid));
    const [isAdmin, setIsAdmin] = useState(session.isAcceptedAdmin);
    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cacheRecords, setCacheRecords] = useState([]);
    const [error, setError] = useState('');
    const [gameCode, setGameCode] = useState('');
    const [groupInfo, setGroupInfo] = useState(null);

    const isPlayer = inGame && !isAdmin;
    const {visibleCache, isClaiming, setIsClaiming} = usePlayerGame(
        isPlayer ? userLocation : null,
        isPlayer ? heading : null,
        isPlayer ? cacheRecords : [],
    );

//   Handlers -------------------

    // Load group info for TeamsEnabled check
    useEffect(() => {
        if (!session.currentGid) return;
        getLobby(session.currentGid).then(setGroupInfo);
    }, [inGame]);

    // Load caches for players only
    const loadCaches = useCallback(async () => {
        if (!session.currentGid || isAdmin) {
            setCacheRecords([]);
            return;
        }
        const rows = await getCaches(session.currentGid, session.currentSGid);
        setCacheRecords(rows || []);
    }, [inGame, isAdmin]);

    useEffect(() => { loadCaches(); }, [loadCaches]);

    // Location + compass tracking for players only
    useEffect(() => {
        if (!isPlayer) {
            setLoading(false);
            return;
        }
        let locationSub;
        let headingSub;

        const start = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied');
                setLoading(false);
                return;
            }
            const current = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
            setUserLocation({latitude: current.coords.latitude, longitude: current.coords.longitude});

            locationSub = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Balanced, distanceInterval: 1, timeInterval: 1000},
                (next) => setUserLocation({latitude: next.coords.latitude, longitude: next.coords.longitude}),
            );

            Magnetometer.setUpdateInterval(500);
            headingSub = Magnetometer.addListener((data) => setHeading(toHeading(data)));
            setLoading(false);
        };

        start();
        return () => {
            if (locationSub) locationSub.remove();
            if (headingSub) headingSub.remove();
        };
    }, [isPlayer]);

    const handleJoinGame = async () => {
        if (!gameCode.trim()) return;
        const result = await joinPrivateGame({JoinCode: gameCode.trim(), Uid: session.currentUid});
        if (!result) return;
        setSessionGroup(result.Gid, result.SGid);
        setInGame(true);
        setIsAdmin(false);
        navigation.navigate('TeamScreen');
    };

    const handleCreateGame = async () => {
        const result = await createPrivateGame({
            GroupName: 'My Game',
            CreatedByUid: session.currentUid,
            TeamsEnabled: false,
            MaxMemberSubgroups: 1,
        });
        if (!result) return;
        const freshUser = await getUser(session.currentUid);
        if (freshUser) {
            setSessionUser(freshUser);
            setInGame(true);
            setIsAdmin(true);
        }
    };

    const handleClaim = async (cacheId) => {
        if (!session.currentGid) return;
        await claimCache({
            gid: session.currentGid,
            cacheId,
            uid: session.currentUid,
            tid: session.currentTid,
        });
        setIsClaiming(false);
        await loadCaches();
    };

//   View -----------------------

    // Not in a game
    if (!inGame) {
        return (
            <Screen style={styles.center}>
                <View style={styles.row}>
                    <TextInput
                        style={styles.codeInput}
                        placeholder="Enter Game Code"
                        value={gameCode}
                        onChangeText={setGameCode}
                        autoCapitalize="characters"
                    />
                    <Button
                        label="Join"
                        onClick={handleJoinGame}
                        styleButton={styles.joinButton}
                        styleLabel={styles.joinLabel}
                    />
                </View>
                <ButtonTray>
                    <Button
                        label="Create a Game"
                        onClick={handleCreateGame}
                        styleButton={styles.createButton}
                        styleLabel={styles.createLabel}
                    />
                </ButtonTray>
            </Screen>
        );
    }

    // Admin view
    if (isAdmin) {
        return (
            <Screen style={styles.center}>
                <Text style={styles.body}>Admins manage caches from Manage Game.</Text>
            </Screen>
        );
    }

    // Loading
    if (loading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large"/>
            </Screen>
        );
    }

    // Error
    if (error) {
        return (
            <Screen style={styles.center}>
                <Text style={styles.error}>{error}</Text>
            </Screen>
        );
    }

    // Player in game
    const teamsWarning = groupInfo?.TeamsEnabled && !session.currentTid;

    return (
        <Screen style={styles.containerMap}>
            {teamsWarning && (
                <Text style={styles.warning}>You are not in a team. Teams are required for this game!</Text>
            )}
            <View style={styles.mapWrap}>
                <PlayerMapView
                    userLocation={userLocation}
                    visibleCache={visibleCache}
                    isClaiming={isClaiming}
                    onClaimSuccess={handleClaim}
                />
            </View>
            <View style={styles.cacheSection}>
                <ScrollView>
                    {cacheRecords.map((cache) => (
                        <View key={cache.id} style={styles.cacheCard}>
                            <Text style={styles.cacheClue}>{cache.clue}</Text>
                            <Text style={[styles.cacheStatus, cache.ClaimedByUid && styles.cacheStatusClaimed]}>
                                {cache.ClaimedByUid ? 'Claimed' : 'Available'}
                            </Text>
                        </View>
                    ))}
                    {cacheRecords.length === 0 && (
                        <Text style={styles.emptyText}>No caches available yet.</Text>
                    )}
                </ScrollView>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    center: {justifyContent: 'center', alignItems: 'center'},
    containerMap: {padding: 0},
    mapWrap: {flex: 2},
    body: {color: '#4b5563', fontSize: 15},
    error: {color: '#dc2626', fontSize: 15},
    row: {flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%', paddingHorizontal: 20},
    codeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    joinButton: {backgroundColor: '#2563eb', borderColor: '#2563eb', flex: 0, paddingHorizontal: 20},
    joinLabel: {color: '#ffffff', fontWeight: '600'},
    createButton: {backgroundColor: '#16a34a', borderColor: '#16a34a'},
    createLabel: {color: '#ffffff', fontWeight: '600'},
    warning: {
        color: '#dc2626',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 14,
    },
    cacheSection: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    cacheCard: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cacheClue: {fontSize: 15, fontWeight: '600', color: '#1f2937'},
    cacheStatus: {fontSize: 13, color: '#16a34a', fontWeight: '600'},
    cacheStatusClaimed: {color: '#9ca3af'},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 20, fontSize: 14},
});

export default MapScreen;
