import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Circle, Marker, Polygon} from 'react-native-maps';
import * as Location from 'expo-location';
import Screen from '../layout/Screen';
import {getFovCone, isInClaimCone} from '../../utils/geoMath';

const DEFAULT_REGION = {latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.01, longitudeDelta: 0.01};

const ExpandedMapScreen = ({route}) => {
    const {isAdmin, cacheRecords: cacheStr, claimDistance: routeClaimDistance, userLocation: routeLocation, selectedCacheId} = route.params || {};
    const caches = cacheStr ? JSON.parse(cacheStr) : [];
    const claimDistance = routeClaimDistance || 20;

    const [userLocation, setUserLocation] = useState(routeLocation || null);
    const [heading, setHeading] = useState(null);

    useEffect(() => {
        let locationSub;
        let headingSub;

        const start = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            if (!routeLocation) {
                const last = await Location.getLastKnownPositionAsync();
                if (last) {
                    setUserLocation({latitude: last.coords.latitude, longitude: last.coords.longitude});
                } else {
                    const pos = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Low});
                    setUserLocation({latitude: pos.coords.latitude, longitude: pos.coords.longitude});
                }
            }

            locationSub = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Balanced, distanceInterval: 2, timeInterval: 1000},
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
    }, []);

    const region = userLocation
        ? {...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}
        : DEFAULT_REGION;

    const hasHeading = heading !== null;
    const coneCoords = (userLocation && hasHeading) ? getFovCone(userLocation, heading) : null;

    const visiblePlayerCaches = (!isAdmin && userLocation && hasHeading && selectedCacheId)
        ? caches.filter((c) => c.id === selectedCacheId && isInClaimCone(heading, userLocation, c.coordinates, claimDistance))
        : [];

    return (
        <Screen showBack={true} style={styles.container}>
            <View style={styles.mapWrap}>
                <MapView
                    style={{flex: 1}}
                    provider="google"
                    initialRegion={region}
                    showsUserLocation
                >
                    {isAdmin && caches.map((cache) => (
                        <React.Fragment key={cache.id}>
                            <Marker coordinate={cache.coordinates} pinColor="#9ca3af" title={cache.name || cache.clue} />
                            <Circle
                                center={cache.coordinates}
                                radius={claimDistance}
                                fillColor="rgba(59,130,246,0.15)"
                                strokeColor="rgba(59,130,246,0.85)"
                            />
                        </React.Fragment>
                    ))}
                    {!isAdmin && visiblePlayerCaches.map((cache) => (
                        <Marker
                            key={cache.id}
                            coordinate={cache.coordinates}
                            pinColor="orange"
                            title={cache.clue}
                        />
                    ))}
                    {coneCoords && (
                        <Polygon
                            coordinates={coneCoords}
                            fillColor="rgba(66,133,244,0.28)"
                            strokeColor="rgba(66,133,244,0.50)"
                            strokeWidth={1}
                        />
                    )}
                </MapView>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {padding: 0},
    mapWrap: {flex: 1},
});

export default ExpandedMapScreen;


