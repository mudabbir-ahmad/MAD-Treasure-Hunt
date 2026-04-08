import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import MapView, {Circle, Marker, Polygon} from 'react-native-maps';
import * as Location from 'expo-location';
import {useFocusEffect} from '@react-navigation/native';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';
import CacheCardItem from '../gameplay/CacheCardItem';
import ClaimTimerView from '../gameplay/ClaimTimerView';
import PlayerMapView from '../gameplay/PlayerMapView';
import useGameHook from '../../hooks/useGameHook';
import usePlayerGame from '../../hooks/usePlayerGame';
import {getSession, setSelectedCache, setSessionGroup, setSessionUser} from '../../hooks/SessionStore';
import {getFovCone} from '../../utils/geoMath';

const DEFAULT_REGION = {latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.05, longitudeDelta: 0.05};


const MapScreen = ({navigation}) => {
//   Initialisation ------------

    const session = getSession();
    const {getCaches, claimCache, upsertCache, deleteCache, joinPrivateGame, createPrivateGame, getLobby, getUser, getSubgroups} = useGameHook();

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
    const [selectedCacheId, setSelectedCacheIdState] = useState(session.selectedCacheId);
    const [claimedPopupVisible, setClaimedPopupVisible] = useState(false);
    const [subgroups, setSubgroups] = useState([]);

    // Admin cache creation / editing state
    const [isCreating, setIsCreating] = useState(false);
    const [editingCacheId, setEditingCacheId] = useState(null);
    const [newCoord, setNewCoord] = useState(null);
    const [newName, setNewName] = useState('');
    const [newClue, setNewClue] = useState('');

    // Global claim distance comes from the group's CacheTriggerMeters setting
    const claimDistance = groupInfo?.CacheTriggerMeters || 20;

    const isPlayer = inGame && !isAdmin;

    // Filter out caches already claimed by the current user's team (or by the user if no team)
    const activeCachesForPlayer = useMemo(() => {
        if (!isPlayer) return [];
        return cacheRecords.filter((cache) => {
            const claims = cache.Claims || [];
            if (session.currentTid) {
                return !claims.some((c) => c.Tid === session.currentTid);
            }
            return !claims.some((c) => c.Uid === session.currentUid);
        });
    }, [cacheRecords, isPlayer, session.currentTid, session.currentUid]);

    const {visibleCaches, isClaiming, setIsClaiming} = usePlayerGame(
        isPlayer ? userLocation : null,
        isPlayer ? heading : null,
        isPlayer ? activeCachesForPlayer : [],
        claimDistance,
    );

    const mapRegion = userLocation
        ? {...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}
        : DEFAULT_REGION;

//   Handlers -------------------

    useEffect(() => {
        if (!session.currentGid) return;
        getLobby(session.currentGid).then(setGroupInfo);
        getSubgroups(session.currentGid).then(setSubgroups);
    }, [inGame]);

    // Default member subgroup SGid for cache creation (first non-admin subgroup)
    const defaultMemberSGid = subgroups.find((sg) => !sg.IsAdminGroup)?.SGid || null;

    // Always call getSession() fresh inside the callback so we never read a
    // stale currentGid from the closure — matches the server's /caches endpoint
    const loadCaches = useCallback(async () => {
        const currentGid = getSession().currentGid;
        if (!currentGid) {
            setCacheRecords([]);
            return;
        }
        const rows = await getCaches(currentGid, null);
        setCacheRecords(rows || []);
    }, [getCaches]);

    // Run once on mount
    useEffect(() => { loadCaches(); }, [loadCaches]);

    // Re-fetch caches every time this screen gains focus so the list is always
    // up-to-date after navigating away and back (e.g. Settings → Map)
    useFocusEffect(
        useCallback(() => { loadCaches(); }, [loadCaches])
    );

    // Auto-select the first cache for the player when caches load and none is selected
    useEffect(() => {
        if (!isPlayer || cacheRecords.length === 0) return;
        // If persisted selection still exists in the list, keep it
        if (selectedCacheId && cacheRecords.some((c) => c.id === selectedCacheId)) return;
        // Otherwise auto-select the first cache
        const firstId = cacheRecords[0].id;
        setSelectedCacheIdState(firstId);
        setSelectedCache(firstId);
    }, [cacheRecords, isPlayer]);

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

            // Try cached position first for instant load, fall back to fresh fix
            const last = await Location.getLastKnownPositionAsync();
            if (last) {
                setUserLocation({latitude: last.coords.latitude, longitude: last.coords.longitude});
            } else {
                const current = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Low});
                setUserLocation({latitude: current.coords.latitude, longitude: current.coords.longitude});
            }
            setPlayerLoading(false);

            locationSub = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Balanced, distanceInterval: 1, timeInterval: 1000},
                (next) => setUserLocation({latitude: next.coords.latitude, longitude: next.coords.longitude}),
            );

            // Use OS-fused heading from expo-location
            headingSub = await Location.watchHeadingAsync((headingData) => {
                const raw = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
                setHeading(raw);
            });
        };

        start();
        return () => {
            if (locationSub) locationSub.remove();
            if (headingSub) headingSub.remove();
        };
    }, [inGame, isPlayer]);

    const handleJoinGame = async () => {
        if (!gameCode.trim()) return;
        // Force uppercase just in case a lowercase code is pasted
        const result = await joinPrivateGame({JoinCode: gameCode.trim().toUpperCase(), Uid: session.currentUid});
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

    const handleClaim = useCallback(async (cacheId) => {
        if (!session.currentGid) return;
        const result = await claimCache({
            gid: session.currentGid,
            cacheId,
            uid: session.currentUid,
            tid: session.currentTid,
        });
        setIsClaiming(false);
        if (result) {
            // Show "Cache Claimed!" popup for 3 seconds
            setClaimedPopupVisible(true);
            setTimeout(() => setClaimedPopupVisible(false), 3000);
        }
        await loadCaches();
    }, [session.currentGid, session.currentUid, session.currentTid, loadCaches]);

    // Admin — open create form
    const handleCreateCachePress = () => {
        const fallback = userLocation || {latitude: mapRegion.latitude, longitude: mapRegion.longitude};
        setEditingCacheId(null);
        setNewCoord(fallback);
        setNewName('');
        setNewClue('');
        setIsCreating(true);
    };

    // Admin — open edit form
    const handleEditCache = (cache) => {
        setEditingCacheId(cache.id);
        setNewCoord(cache.coordinates);
        setNewName(cache.name || '');
        setNewClue(cache.clue || '');
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
            name: newName.trim(),
            latitude: newCoord.latitude,
            longitude: newCoord.longitude,
            clue: newClue.trim(),
            subgroupId: defaultMemberSGid,
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

    // Navigate to expanded map view, passing the live location so it opens centred on the user
    const handleExpandMap = () => {
        navigation.navigate('ExpandedMapScreen', {
            isAdmin,
            cacheRecords: JSON.stringify(cacheRecords),
            heading: heading || 0,
            claimDistance,
            userLocation: userLocation || null,
        });
    };

    // Player — select cache (persist selection)
    const handleSelectCache = (cache) => {
        setSelectedCacheIdState(cache.id);
        setSelectedCache(cache.id);
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
                        placeholderTextColor="#9ca3af"
                        value={gameCode}
                        onChangeText={(text) => setGameCode(text.toUpperCase())}
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
                                    radius={claimDistance}
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
                                    radius={claimDistance}
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
                        placeholder="Cache Name"
                        placeholderTextColor="#9ca3af"
                        value={newName}
                        onChangeText={setNewName}
                    />
                    <TextInput
                        style={styles.formInput}
                        placeholder="Cache Clue"
                        placeholderTextColor="#9ca3af"
                        value={newClue}
                        onChangeText={setNewClue}
                    />
                    <View style={styles.coordRow}>
                        <View style={styles.coordField}>
                            <Text style={styles.coordLabel}>Latitude</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Latitude"
                                placeholderTextColor="#9ca3af"
                                value={newCoord ? String(newCoord.latitude.toFixed(6)) : ''}
                                editable={false}
                            />
                        </View>
                        <View style={styles.coordField}>
                            <Text style={styles.coordLabel}>Longitude</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Longitude"
                                placeholderTextColor="#9ca3af"
                                value={newCoord ? String(newCoord.longitude.toFixed(6)) : ''}
                                editable={false}
                            />
                        </View>
                    </View>
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
                <View style={styles.mapContainer}>
                    <MapView
                        style={{flex: 1}}
                        region={mapRegion}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        showsUserLocation
                    >
                        {cacheRecords.map((cache) => (
                            <React.Fragment key={cache.id}>
                                <Marker coordinate={cache.coordinates} title={cache.name || cache.clue}/>
                                <Circle
                                    center={cache.coordinates}
                                    radius={claimDistance}
                                    fillColor="rgba(59,130,246,0.15)"
                                    strokeColor="rgba(59,130,246,0.85)"
                                />
                            </React.Fragment>
                        ))}
                        {userLocation && heading !== null && (
                            <Polygon
                                coordinates={getFovCone(userLocation, heading)}
                                fillColor="rgba(66,133,244,0.28)"
                                strokeColor="rgba(66,133,244,0.50)"
                                strokeWidth={1}
                            />
                        )}
                    </MapView>
                    <Pressable style={styles.expandButton} onPress={handleExpandMap}>
                        <Text style={styles.expandIcon}>⛶</Text>
                    </Pressable>
                </View>
                <View style={styles.createCacheWrap}>
                    <Button
                        label="Create Cache"
                        onClick={handleCreateCachePress}
                        styleButton={styles.createCacheButton}
                        styleLabel={styles.createCacheLabel}
                    />
                </View>
                <View style={styles.cacheListWrap}>
                    <ScrollView contentContainerStyle={styles.cacheListContent}>
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

    // Player in game — use the first visible cache for the claim timer
    const teamsWarning = groupInfo?.TeamsEnabled && !session.currentTid;
    const claimTarget = visibleCaches.length > 0 ? visibleCaches[0] : null;

    return (
        <Screen style={styles.containerMap}>
            {teamsWarning && (
                <Text style={styles.warning}>You are not in a team. Teams are required for this game!</Text>
            )}
            <View style={styles.mapContainer}>
                <PlayerMapView
                    userLocation={userLocation}
                    visibleCaches={visibleCaches}
                    heading={heading}
                    claimDistance={claimDistance}
                />
                <Pressable style={styles.expandButton} onPress={handleExpandMap}>
                    <Text style={styles.expandIcon}>⛶</Text>
                </Pressable>
            </View>
            <ClaimTimerView
                cache={claimTarget}
                isClaiming={isClaiming}
                onClaimSuccess={handleClaim}
                showClaimedPopup={claimedPopupVisible}
            />
            <View style={styles.cacheSection}>
                <ScrollView>
                    {cacheRecords.map((cache) => (
                        <CacheCardItem
                            key={cache.id}
                            cache={cache}
                            isAdmin={false}
                            isSelected={selectedCacheId === cache.id}
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
    mapContainer: {height: 200},
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
        color: '#1f2937',
        backgroundColor: '#ffffff',
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
    expandButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    expandIcon: {color: '#ffffff', fontSize: 18, fontWeight: '700'},
    // Admin create button + scrollable cache list
    createCacheWrap: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    createCacheButton: {backgroundColor: '#2563eb', borderColor: '#2563eb', flex: 0},
    createCacheLabel: {color: '#ffffff', fontWeight: '600'},
    cacheListWrap: {flex: 1, backgroundColor: '#f3f4f6'},
    cacheListContent: {paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12},
    // Cache editor form
    formSection: {flex: 1, paddingHorizontal: 12, paddingVertical: 10},
    formInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1f2937',
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
    // Player cache section
    cacheSection: {flex: 1, backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingTop: 10},
    emptyText: {color: '#9ca3af', textAlign: 'center', marginTop: 20, fontSize: 14},
    mapWrap: {flex: 1},
});

export default MapScreen;
