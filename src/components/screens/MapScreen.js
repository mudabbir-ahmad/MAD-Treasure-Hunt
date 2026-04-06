import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import MapView, {Circle, Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import {Magnetometer} from 'expo-sensors';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import CacheCardItem from '../gameplay/CacheCardItem';
import PlayerMapView from '../gameplay/PlayerMapView';
import useGameHook from '../../hooks/useGameHook';
import usePlayerGame from '../../hooks/usePlayerGame';
import {getSession, setSessionGroup, setSessionUser} from '../../hooks/SessionStore';

const DEFAULT_REGION = {latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.05, longitudeDelta: 0.05};

const toHeading = ({x, y}) => {
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    return angle < 0 ? angle + 360 : angle;
};

const MapScreen = ({navigation}) => {
//   Initialisation ------------

    const session = getSession();
    const {getCaches, claimCache, upsertCache, deleteCache, joinPrivateGame, createPrivateGame, getLobby, getUser} = useGameHook();

//   State ----------------------

    const [inGame, setInGame] = useState(Boolean(session.currentGid));
    const [isAdmin, setIsAdmin] = useState(session.isAcceptedAdmin);
    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(null);
    const [playerLoading, setPlayerLoading] = useState(true);
    const [cacheRecords, setCacheRecords] = useState([]);
    const [error, setError] = useState('');
    const [gameCode, setGameCode] = useState('');
    const [groupInfo, setGroupInfo] = useState(null);

    // Admin cache creation / editing state
    const [isCreating, setIsCreating] = useState(false);
    const [editingCacheId, setEditingCacheId] = useState(null);
    const [newCoord, setNewCoord] = useState(null);
    const [newClue, setNewClue] = useState('');
    const [newRadius, setNewRadius] = useState('20');

    const isPlayer = inGame && !isAdmin;
    const {visibleCache, isClaiming, setIsClaiming} = usePlayerGame(
        isPlayer ? userLocation : null,
        isPlayer ? heading : null,
        isPlayer ? cacheRecords : [],
    );

    const mapRegion = userLocation
        ? {...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}
        : DEFAULT_REGION;

//   Handlers -------------------

    useEffect(() => {
        if (!session.currentGid) return;
        getLobby(session.currentGid).then(setGroupInfo);
    }, [inGame]);

    const loadCaches = useCallback(async () => {
        if (!session.currentGid) {
            setCacheRecords([]);
            return;
        }
        const sgFilter = isAdmin ? null : session.currentSGid;
        const rows = await getCaches(session.currentGid, sgFilter);
        setCacheRecords(rows || []);
    }, [inGame, isAdmin]);

    useEffect(() => { loadCaches(); }, [loadCaches]);

    // Location tracking
    useEffect(() => {
        if (!inGame) return;
        let locationSub;
        let headingSub;

        const start = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied');
                setPlayerLoading(false);
                return;
            }
            const current = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
            setUserLocation({latitude: current.coords.latitude, longitude: current.coords.longitude});

            locationSub = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Balanced, distanceInterval: 1, timeInterval: 1000},
                (next) => setUserLocation({latitude: next.coords.latitude, longitude: next.coords.longitude}),
            );

            if (isPlayer) {
                Magnetometer.setUpdateInterval(500);
                headingSub = Magnetometer.addListener((data) => setHeading(toHeading(data)));
            }
            setPlayerLoading(false);
        };

        start();
        return () => {
            if (locationSub) locationSub.remove();
            if (headingSub) headingSub.remove();
        };
    }, [inGame, isPlayer]);

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
            navigation.navigate('GameSettingsScreen');
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

    // Admin — open create form
    const handleCreateCachePress = () => {
        const fallback = userLocation || {latitude: mapRegion.latitude, longitude: mapRegion.longitude};
        setEditingCacheId(null);
        setNewCoord(fallback);
        setNewClue('');
        setNewRadius('20');
        setIsCreating(true);
    };

    // Admin — open edit form
    const handleEditCache = (cache) => {
        setEditingCacheId(cache.id);
        setNewCoord(cache.coordinates);
        setNewClue(cache.clue || '');
        setNewRadius(String(cache.radius || 20));
        setIsCreating(true);
    };

    // Admin — delete cache
    const handleDeleteCache = async (cache) => {
        if (!session.currentGid) return;
        await deleteCache(session.currentGid, cache.id);
        await loadCaches();
    };

    // Admin — save create or edit
    const handleSaveCache = async () => {
        if (!newCoord || !newClue.trim() || !session.currentGid) return;
        const payload = {
            gid: session.currentGid,
            latitude: newCoord.latitude,
            longitude: newCoord.longitude,
            radius: parseInt(newRadius) || 20,
            clue: newClue.trim(),
            subgroupId: 1,
        };
        if (editingCacheId) payload.cacheId = editingCacheId;
        await upsertCache(payload);
        setIsCreating(false);
        setEditingCacheId(null);
        await loadCaches();
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setEditingCacheId(null);
    };

    // Player — select cache (scroll to / highlight)
    const handleSelectCache = (cache) => {
        // Future: scroll map to cache location
    };

//   View -----------------------

    // Not in a game
    if (!inGame) {
        return (
            <Screen style={styles.center}>
                <View style={styles.inputRow}>
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
                <View style={styles.fullRow}>
                    <ButtonTray>
                        <Button
                            label="Create a Game"
                            onClick={handleCreateGame}
                            styleButton={styles.createButton}
                            styleLabel={styles.createLabel}
                        />
                    </ButtonTray>
                </View>
            </Screen>
        );
    }

    // Admin — creating / editing a cache
    if (isAdmin && isCreating) {
        return (
            <Screen style={styles.containerMap}>
                <View style={styles.mapWrap}>
                    <MapView
                        style={{flex: 1}}
                        initialRegion={newCoord ? {...newCoord, latitudeDelta: 0.01, longitudeDelta: 0.01} : mapRegion}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        onPress={(e) => setNewCoord(e.nativeEvent.coordinate)}
                        showsUserLocation
                    >
                        {cacheRecords.map((cache) => (
                            <React.Fragment key={cache.id}>
                                <Marker coordinate={cache.coordinates} pinColor="#9ca3af" title={cache.clue}/>
                                <Circle
                                    center={cache.coordinates}
                                    radius={cache.radius}
                                    fillColor="rgba(156,163,175,0.15)"
                                    strokeColor="rgba(156,163,175,0.6)"
                                />
                            </React.Fragment>
                        ))}
                        {newCoord && (
                            <>
                                <Marker
                                    coordinate={newCoord}
                                    draggable
                                    tracksViewChanges={false}
                                    pinColor="#2563eb"
                                    title={editingCacheId ? 'Edit Cache' : 'New Cache'}
                                    onDragEnd={(e) => setNewCoord(e.nativeEvent.coordinate)}
                                />
                                <Circle
                                    center={newCoord}
                                    radius={parseInt(newRadius) || 20}
                                    fillColor="rgba(37,99,235,0.15)"
                                    strokeColor="rgba(37,99,235,0.85)"
                                />
                            </>
                        )}
                    </MapView>
                </View>
                <ScrollView style={styles.formSection}>
                    <TextInput
                        style={styles.formInput}
                        placeholder="Cache's Clue"
                        value={newClue}
                        onChangeText={setNewClue}
                    />
                    <View style={styles.coordRow}>
                        <View style={styles.coordField}>
                            <Text style={styles.coordLabel}>Latitude</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Latitude"
                                value={newCoord ? String(newCoord.latitude.toFixed(6)) : ''}
                                editable={false}
                            />
                        </View>
                        <View style={styles.coordField}>
                            <Text style={styles.coordLabel}>Longitude</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Longitude"
                                value={newCoord ? String(newCoord.longitude.toFixed(6)) : ''}
                                editable={false}
                            />
                        </View>
                    </View>
                    <TextInput
                        style={styles.formInput}
                        placeholder="Claim Radius (metres)"
                        value={newRadius}
                        onChangeText={setNewRadius}
                        keyboardType="numeric"
                    />
                    <ButtonTray>
                        <Button
                            label={editingCacheId ? 'Update Cache' : 'Save Cache'}
                            onClick={handleSaveCache}
                            styleButton={styles.saveButton}
                            styleLabel={styles.saveLabel}
                        />
                        <Button
                            label="Cancel"
                            onClick={handleCancelCreate}
                            styleButton={styles.cancelButton}
                            styleLabel={styles.cancelLabel}
                        />
                    </ButtonTray>
                </ScrollView>
            </Screen>
        );
    }

    // Admin — normal view (map + create button + cache list)
    if (isAdmin) {
        return (
            <Screen style={styles.containerMap}>
                <View style={styles.mapWrap}>
                    <MapView
                        style={{flex: 1}}
                        initialRegion={mapRegion}
                        showsUserLocation
                    >
                        {cacheRecords.map((cache) => (
                            <React.Fragment key={cache.id}>
                                <Marker coordinate={cache.coordinates} title={cache.clue}/>
                                <Circle
                                    center={cache.coordinates}
                                    radius={cache.radius}
                                    fillColor="rgba(59,130,246,0.15)"
                                    strokeColor="rgba(59,130,246,0.85)"
                                />
                            </React.Fragment>
                        ))}
                    </MapView>
                </View>
                <View style={styles.createCacheWrap}>
                    <Button
                        label="Create Cache"
                        onClick={handleCreateCachePress}
                        styleButton={styles.createCacheButton}
                        styleLabel={styles.createCacheLabel}
                    />
                </View>
                <View style={styles.cacheSection}>
                    <ScrollView>
                        {cacheRecords.map((cache) => (
                            <CacheCardItem
                                key={cache.id}
                                cache={cache}
                                isAdmin={true}
                                onEdit={handleEditCache}
                                onDelete={handleDeleteCache}
                            />
                        ))}
                        {cacheRecords.length === 0 && (
                            <Text style={styles.emptyText}>No caches yet. Tap Create Cache to add one.</Text>
                        )}
                    </ScrollView>
                </View>
            </Screen>
        );
    }

    // Player — loading location
    if (playerLoading) {
        return (
            <Screen style={styles.center}>
                <ActivityIndicator size="large"/>
                <Text style={styles.loadingText}>Getting your location...</Text>
            </Screen>
        );
    }

    // Player — error
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
                        <CacheCardItem
                            key={cache.id}
                            cache={cache}
                            isAdmin={false}
                            onSelect={handleSelectCache}
                        />
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
    mapWrap: {flex: 1},
    error: {color: '#dc2626', fontSize: 15},
    loadingText: {color: '#6b7280', fontSize: 14, marginTop: 10},
    inputRow: {flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%', paddingHorizontal: 20},
    fullRow: {width: '100%', paddingHorizontal: 20},
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
    createCacheWrap: {paddingHorizontal: 12, paddingVertical: 8},
    createCacheButton: {backgroundColor: '#2563eb', borderColor: '#2563eb'},
    createCacheLabel: {color: '#ffffff', fontWeight: '600'},
    formSection: {flex: 1, paddingHorizontal: 12, paddingVertical: 10},
    formInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: '#ffffff',
        marginBottom: 10,
    },
    coordRow: {flexDirection: 'row', gap: 10},
    coordField: {flex: 1},
    coordLabel: {fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4},
    saveButton: {backgroundColor: '#16a34a', borderColor: '#16a34a'},
    saveLabel: {color: '#ffffff', fontWeight: '600'},
    cancelButton: {backgroundColor: '#6b7280', borderColor: '#6b7280'},
    cancelLabel: {color: '#ffffff', fontWeight: '600'},
    cacheSection: {
        maxHeight: 160,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingTop: 10,
    },
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 20, fontSize: 14},
});

export default MapScreen;
