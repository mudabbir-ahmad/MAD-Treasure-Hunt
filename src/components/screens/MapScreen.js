import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
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
import {getSession, setSelectedCache, setSessionGroup, setSessionTeam, setSessionUser} from '../../hooks/SessionStore';
import {getFovCone} from '../../utils/geoMath';

const DEFAULT_REGION = {latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.05, longitudeDelta: 0.05};


const MapScreen = ({navigation, route}) => {
  const session = getSession();
  const {getCaches, claimCache, upsertCache, deleteCache, joinPrivateGame, createPrivateGame, getLobby, getUser, getSubgroups, getGroupByOrgCode} = useGameHook();

  // Stable ref to prevent infinite re-render loops
  const getCachesRef = useRef(getCaches);
  getCachesRef.current = getCaches;
  const lastAppliedRouteDepartmentRef = useRef(null);

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

  // Business join flow state
  const [joinStep, setJoinStep] = useState(null);
  const [orgCode, setOrgCode] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [matchedGroup, setMatchedGroup] = useState(null);
  const [joinError, setJoinError] = useState('');

  // Admin cache creation / editing state
  const [isCreating, setIsCreating] = useState(false);
  const [editingCacheId, setEditingCacheId] = useState(null);
  const [newCoord, setNewCoord] = useState(null);
  const [newName, setNewName] = useState('');
  const [newClue, setNewClue] = useState('');
  const [selectedCacheSubgroupId, setSelectedCacheSubgroupId] = useState(null);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);

  const claimDistance = groupInfo?.CacheTriggerMeters || 20;
  const isPlayer = inGame && !isAdmin;
  const requiresTeam = Boolean(isPlayer && groupInfo?.TeamsEnabled && !session.currentTid);
  const EMPTY_CACHES = useMemo(() => [], []);

  // Caches not yet claimed by the current user's team (or user if no team)
  const activeCachesForPlayer = useMemo(() => {
    if (!isPlayer) return EMPTY_CACHES;
    return cacheRecords.filter((cache) => {
      const claims = cache.Claims || [];
      if (session.currentTid) {
        return !claims.some((c) => c.Tid === session.currentTid);
      }
      return !claims.some((c) => c.Uid === session.currentUid);
    });
  }, [cacheRecords, isPlayer, session.currentTid, session.currentUid, EMPTY_CACHES]);

    const {visibleCaches, isClaiming, setIsClaiming} = usePlayerGame(
        (isPlayer && !requiresTeam) ? userLocation : null,
        (isPlayer && !requiresTeam) ? heading : null,
        requiresTeam ? EMPTY_CACHES : activeCachesForPlayer,
        claimDistance,
        selectedCacheId,
    );

  const mapRegion = userLocation
    ? {...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}
    : DEFAULT_REGION;

  useEffect(() => {
    if (!session.currentGid) return;
    getLobby(session.currentGid).then(setGroupInfo);
    getSubgroups(session.currentGid).then(setSubgroups);
  }, [inGame]);

  // Default member subgroup SGid for cache creation (first non-admin subgroup)
  const departments = useMemo(
    () => subgroups.filter((sg) => !sg.IsAdminGroup),
    [subgroups],
  );
  const defaultMemberSGid = departments[0]?.SGid || null;
  const departmentNamesById = useMemo(() => {
    const map = {};
    for (const subgroup of departments) {
      map[String(subgroup.SGid)] = subgroup.SubGroupName || `Department ${subgroup.SGid}`;
    }
    return map;
  }, [departments]);

    useEffect(() => {
        if (!isAdmin || departments.length === 0) return;
        const routeSelectedSgid = route?.params?.selectedDepartmentSGid;
        const hasRouteDepartment = departments.some((sg) => String(sg.SGid) === String(routeSelectedSgid));
        const shouldApplyRouteDepartment =
            hasRouteDepartment && String(lastAppliedRouteDepartmentRef.current) !== String(routeSelectedSgid);
        if (shouldApplyRouteDepartment) {
            setSelectedCacheSubgroupId(routeSelectedSgid);
            lastAppliedRouteDepartmentRef.current = routeSelectedSgid;
            return;
        }

        const currentStillValid = departments.some((sg) => String(sg.SGid) === String(selectedCacheSubgroupId));
        if (!currentStillValid) {
            setSelectedCacheSubgroupId(defaultMemberSGid);
        }
    }, [route?.params?.selectedDepartmentSGid, departments, isAdmin, selectedCacheSubgroupId, defaultMemberSGid]);

    const loadCaches = useCallback(async () => {
        const currentGid = getSession().currentGid;
        if (!currentGid) {
            setCacheRecords([]);
            return;
        }
        const rows = await getCachesRef.current(currentGid, null);
        setCacheRecords(rows || []);
    }, []);

    // Run once on mount
    useEffect(() => { loadCaches(); }, [loadCaches]);

    // Re-fetch caches when screen gains focus
    useFocusEffect(
        useCallback(() => { loadCaches(); }, [loadCaches])
    );

    // Auto-select first unclaimed cache when list loads
    useEffect(() => {
        if (!isPlayer || activeCachesForPlayer.length === 0) return;
        if (selectedCacheId && activeCachesForPlayer.some((c) => c.id === selectedCacheId)) return;
        const firstId = activeCachesForPlayer[0].id;
        setSelectedCacheIdState(firstId);
        setSelectedCache(firstId);
    }, [activeCachesForPlayer, isPlayer]);

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
        const result = await joinPrivateGame({JoinCode: gameCode.trim().toUpperCase(), Uid: session.currentUid});
        if (!result) return;
        setSessionGroup(result.Gid, result.SGid);

        const freshUser = await getUser(session.currentUid);
        if (freshUser) {
            setSessionUser(freshUser);
            setSessionTeam(freshUser.TGid ?? null);
        }

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
            navigation.reset({index: 0, routes: [{name: 'Admin'}]});
        }
    };

    // Business — create a new company
    const handleCreateCompany = async () => {
        const result = await createPrivateGame({
            GroupName: 'My Company',
            BusinessOrSchoolName: 'My Company',
            CreatedByUid: session.currentUid,
            TeamsEnabled: false,
            MaxMemberSubgroups: 1,
            isBusiness: true,
        });
        if (!result) return;
        const freshUser = await getUser(session.currentUid);
        if (freshUser) {
            setSessionUser(freshUser);
            setInGame(true);
            setIsAdmin(true);
            navigation.reset({index: 0, routes: [{name: 'Admin'}]});
        }
    };

    // Business — verify the org code
    const handleVerifyOrgCode = async () => {
        setJoinError('');
        if (!orgCode.trim()) return;
        const group = await getGroupByOrgCode(orgCode.trim().toUpperCase());
        if (!group) {
            setJoinError('Organisation not found. Check your code and try again.');
            return;
        }
        setMatchedGroup(group);
        setJoinStep('deptCode');
    };

    // Business — join a department within the matched org
    const handleJoinDepartment = async () => {
        setJoinError('');
        if (!deptCode.trim()) return;
        const result = await joinPrivateGame({
            JoinCode: deptCode.trim().toUpperCase(),
            Uid: session.currentUid,
            ExpectedGid: matchedGroup.Gid,
        });
        if (!result) {
            setJoinError('Invalid department code. Check the code and try again.');
            return;
        }
        setSessionGroup(result.Gid, result.SGid);
        const freshUser = await getUser(session.currentUid);
        if (freshUser) {
            setSessionUser(freshUser);
            setSessionTeam(freshUser.TGid ?? null);
        }
        setInGame(true);
        setIsAdmin(false);
        setJoinStep(null);
        navigation.navigate('TeamScreen');
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
            setClaimedPopupVisible(true);
            setTimeout(() => setClaimedPopupVisible(false), 3000);
        }
        await loadCaches();
    }, [session.currentGid, session.currentUid, session.currentTid, loadCaches]);

    const handleCreateCachePress = () => {
        const fallback = userLocation || {latitude: mapRegion.latitude, longitude: mapRegion.longitude};
        setEditingCacheId(null);
        setNewCoord(fallback);
        setNewName('');
        setNewClue('');
        if (!selectedCacheSubgroupId && defaultMemberSGid) setSelectedCacheSubgroupId(defaultMemberSGid);
        setDepartmentDropdownOpen(false);
        setIsCreating(true);
    };

    const handleEditCache = (cache) => {
        setEditingCacheId(cache.id);
        setNewCoord(cache.coordinates);
        setNewName(cache.name || '');
        setNewClue(cache.clue || '');
        setSelectedCacheSubgroupId(cache.subgroupId || defaultMemberSGid);
        setDepartmentDropdownOpen(false);
        setIsCreating(true);
    };

    const handleDeleteCache = async (cache) => {
        if (!session.currentGid) return;
        await deleteCache(session.currentGid, cache.id);
        await loadCaches();
    };

    const handleSaveCache = async () => {
        if (!newCoord || !newClue.trim() || !session.currentGid) return;
        const subgroupId = selectedCacheSubgroupId || defaultMemberSGid;
        if (!subgroupId) return;
        const payload = {
            gid: session.currentGid,
            name: newName.trim(),
            latitude: newCoord.latitude,
            longitude: newCoord.longitude,
            clue: newClue.trim(),
            subgroupId,
        };
        if (editingCacheId) payload.cacheId = editingCacheId;
        await upsertCache(payload);
        setIsCreating(false);
        setEditingCacheId(null);
        setDepartmentDropdownOpen(false);
        await loadCaches();
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setEditingCacheId(null);
        setDepartmentDropdownOpen(false);
    };

    const handleExpandMap = () => {
        navigation.navigate('ExpandedMapScreen', {
            isAdmin,
            cacheRecords: JSON.stringify(cacheRecords),
            heading: heading || 0,
            claimDistance,
            userLocation: userLocation || null,
            selectedCacheId,
        });
    };

    const handleSelectCache = (cache) => {
        setSelectedCacheIdState(cache.id);
        setSelectedCache(cache.id);
    };

    const isCacheClaimedByMe = (cache) => {
        const claims = cache.Claims || [];
        if (session.currentTid) return claims.some((c) => c.Tid === session.currentTid);
        return claims.some((c) => c.Uid === session.currentUid);
    };

    const showAdminDepartmentLabel = Boolean(isAdmin && groupInfo?.BusinessOrSchoolName);

//   View -----------------------

    // Not in a game — Business flow
    if (!inGame && session.isBusiness) {
        // Step 2: Enter department code
        if (joinStep === 'deptCode' && matchedGroup) {
            return (
                <Screen style={styles.center}>
                    <Text style={styles.bizTitle}>Join {matchedGroup.BusinessOrSchoolName || 'Company'}</Text>
                    <Text style={styles.bizSubtitle}>Enter your department code to join</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.codeInput}
                            placeholder="Department Code"
                            placeholderTextColor="#9ca3af"
                            value={deptCode}
                            onChangeText={(text) => setDeptCode(text.toUpperCase())}
                            autoCapitalize="characters"
                        />
                        <Button
                            label="Join"
                            onClick={handleJoinDepartment}
                            styleButton={styles.joinButton}
                            styleLabel={styles.joinLabel}
                        />
                    </View>
                    {joinError ? <Text style={styles.joinError}>{joinError}</Text> : null}
                    <View style={styles.fullRow}>
                        <ButtonTray>
                            <Button
                                label="Back"
                                onClick={() => { setJoinStep(null); setDeptCode(''); setJoinError(''); }}
                                styleButton={styles.backButton}
                                styleLabel={styles.backLabel}
                            />
                        </ButtonTray>
                    </View>
                </Screen>
            );
        }

        // Default: Join company or Create company choice
        return (
            <Screen style={styles.center}>
                <Text style={styles.bizTitle}>Welcome</Text>
                <Text style={styles.bizSubtitle}>Set up your organisation or join an existing one</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.codeInput}
                            placeholder="Company Code"
                        placeholderTextColor="#9ca3af"
                        value={orgCode}
                        onChangeText={(text) => setOrgCode(text.toUpperCase())}
                        autoCapitalize="characters"
                    />
                    <Button
                        label="Join Company"
                        onClick={handleVerifyOrgCode}
                        styleButton={styles.joinButton}
                        styleLabel={styles.joinLabel}
                    />
                </View>
                {joinError ? <Text style={styles.joinError}>{joinError}</Text> : null}
                <View style={styles.fullRow}>
                    <ButtonTray>
                        <Button
                            label="Create Company"
                            onClick={handleCreateCompany}
                            styleButton={styles.createButton}
                            styleLabel={styles.createLabel}
                        />
                    </ButtonTray>
                </View>
            </Screen>
        );
    }

    // Not in a game — Individual flow
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
                        provider="google"
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
                    <Text style={styles.departmentLabel}>Department</Text>
                    <Pressable
                        style={styles.departmentSelector}
                        onPress={() => setDepartmentDropdownOpen((prev) => !prev)}
                    >
                        <Text style={styles.departmentSelectorText}>
                            {departmentNamesById[String(selectedCacheSubgroupId)] || 'Select department'}
                        </Text>
                        <Text style={styles.departmentSelectorChevron}>{departmentDropdownOpen ? '▲' : '▼'}</Text>
                    </Pressable>
                    {departmentDropdownOpen && (
                        <View style={styles.departmentMenu}>
                            {departments.map((department) => (
                                <Pressable
                                    key={department.SGid}
                                    style={styles.departmentOption}
                                    onPress={() => {
                                        setSelectedCacheSubgroupId(department.SGid);
                                        setDepartmentDropdownOpen(false);
                                    }}
                                >
                                    <Text style={styles.departmentOptionText}>{department.SubGroupName}</Text>
                                </Pressable>
                            ))}
                        </View>
                    )}
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

    // Admin view
    if (isAdmin) {
        return (
            <Screen style={styles.containerMap}>
                <View style={styles.mapContainer}>
                    <MapView
                        style={{flex: 1}}
                        provider="google"
                        initialRegion={mapRegion}
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
                                departmentName={showAdminDepartmentLabel ? (departmentNamesById[String(cache.subgroupId)] || 'Unassigned') : null}
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

    const claimTarget = visibleCaches[0] || null;

    return (
        <Screen style={styles.containerMap}>
            {requiresTeam && (
                <Text style={styles.warning}>You are not in a team. Join a team to start claiming caches!</Text>
            )}
            <View style={styles.mapContainer}>
                <PlayerMapView
                    userLocation={userLocation}
                    visibleCaches={visibleCaches}
                    heading={heading}
                />
                <Pressable style={styles.expandButton} onPress={handleExpandMap}>
                    <Text style={styles.expandIcon}>⛶</Text>
                </Pressable>
            </View>
            {!requiresTeam && (
                <ClaimTimerView
                    cache={claimTarget}
                    isClaiming={isClaiming}
                    onClaimSuccess={handleClaim}
                    showClaimedPopup={claimedPopupVisible}
                />
            )}
            <View style={styles.cacheSection}>
                <ScrollView>
                    {cacheRecords.map((cache) => {
                        const claimed = isCacheClaimedByMe(cache);
                        return (
                            <CacheCardItem
                                key={cache.id}
                                cache={cache}
                                isAdmin={false}
                                isClaimed={claimed}
                                isSelected={!claimed && !requiresTeam && selectedCacheId === cache.id}
                                onSelect={(claimed || requiresTeam) ? undefined : handleSelectCache}
                                disabled={requiresTeam}
                            />
                        );
                    })}
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
    error: {color: '#D92800', fontSize: 15},
    loadingText: {color: '#6c7086', fontSize: 14, marginTop: 10},
    inputRow: {flexDirection: 'row', gap: 10, marginBottom: 15, width: '100%', paddingHorizontal: 20},
    fullRow: {width: '100%', paddingHorizontal: 20},
    codeInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#cdd6f4',
        backgroundColor: '#313244',
    }, joinButton: {backgroundColor: '#bd93f9', borderColor: '#bd93f9', flex: 0, paddingHorizontal: 20},
    joinLabel: {color: '#1e1e2e', fontWeight: '600'},
    createButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1'},
    createLabel: {color: '#1e1e2e', fontWeight: '600'},
    bizTitle: {fontSize: 22, fontWeight: '700', color: '#cdd6f4', marginBottom: 6, textAlign: 'center'},
    bizSubtitle: {fontSize: 14, color: '#bac2de', textAlign: 'center', marginBottom: 20, paddingHorizontal: 20},
    joinError: {color: '#D92800', textAlign: 'center', marginTop: 8, marginBottom: 4, fontSize: 14, paddingHorizontal: 20},
    backButton: {backgroundColor: '#6c7086', borderColor: '#6c7086'},
    backLabel: {color: '#cdd6f4', fontWeight: '600'},
    warning: {
        color: '#D92800',
        fontWeight: 'bold',
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 14,
    },
    expandButton: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 6,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    expandIcon: {color: '#cdd6f4', fontSize: 18, fontWeight: '700'},
    createCacheWrap: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#313244',
        borderBottomWidth: 1,
        borderBottomColor: '#45475a',
    },
    createCacheButton: {backgroundColor: '#bd93f9', borderColor: '#bd93f9', flex: 0},
    createCacheLabel: {color: '#1e1e2e', fontWeight: '600'},
    cacheListWrap: {flex: 1, backgroundColor: '#1e1e2e'},
    cacheListContent: {paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12},
    formSection: {flex: 1, paddingHorizontal: 12, paddingVertical: 10},
    formInput: {
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#cdd6f4',
        backgroundColor: '#313244',
        marginBottom: 10,
    },
    departmentLabel: {fontSize: 13, fontWeight: '600', color: '#bac2de', marginBottom: 6},
    departmentSelector: {
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        backgroundColor: '#313244',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    departmentSelectorText: {color: '#cdd6f4', fontSize: 15, fontWeight: '500'},
    departmentSelectorChevron: {color: '#6c7086', fontSize: 12, fontWeight: '700'},
    departmentMenu: {
        borderWidth: 1,
        borderColor: '#45475a',
        borderRadius: 8,
        backgroundColor: '#313244',
        marginBottom: 10,
        overflow: 'hidden',
    },
    departmentOption: {paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#45475a'},
    departmentOptionText: {color: '#cdd6f4', fontSize: 14},
    coordRow: {flexDirection: 'row', gap: 10},
    coordField: {flex: 1},
    coordLabel: {fontSize: 12, fontWeight: '600', color: '#6c7086', marginBottom: 4},
    saveButton: {backgroundColor: '#a6e3a1', borderColor: '#a6e3a1'},
    saveLabel: {color: '#1e1e2e', fontWeight: '600'},
    cancelButton: {backgroundColor: '#6c7086', borderColor: '#6c7086'},
    cancelLabel: {color: '#cdd6f4', fontWeight: '600'},
    cacheSection: {flex: 1, backgroundColor: '#1e1e2e', paddingHorizontal: 12, paddingTop: 10},
    emptyText: {color: '#6c7086', textAlign: 'center', marginTop: 20, fontSize: 14},
    mapWrap: {flex: 1},
});

export default MapScreen;
