import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Circle, Marker} from 'react-native-maps';
import * as Location from 'expo-location';
import {Magnetometer} from 'expo-sensors';
import Screen from '../layout/Screen';
import {toHeading} from '../../utils/geoMath';

const DEFAULT_REGION = {latitude: 51.5074, longitude: -0.1278, latitudeDelta: 0.01, longitudeDelta: 0.01};

const ExpandedMapScreen = ({route}) => {
//   Initialisation ------------

    const {isAdmin, cacheRecords: cacheStr} = route.params || {};
    const caches = cacheStr ? JSON.parse(cacheStr) : [];

//   State ----------------------

    const [userLocation, setUserLocation] = useState(null);
    const [heading, setHeading] = useState(null);

//   Handlers -------------------

    useEffect(() => {
        let locationSub;
        let headingSub;

        const start = async () => {
            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const pos = await Location.getCurrentPositionAsync({accuracy: Location.Accuracy.Balanced});
            setUserLocation({latitude: pos.coords.latitude, longitude: pos.coords.longitude});

            locationSub = await Location.watchPositionAsync(
                {accuracy: Location.Accuracy.Balanced, distanceInterval: 2, timeInterval: 1000},
                (next) => setUserLocation({latitude: next.coords.latitude, longitude: next.coords.longitude}),
            );

            Magnetometer.setUpdateInterval(500);
            headingSub = Magnetometer.addListener((data) => setHeading(toHeading(data)));
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

//   View -----------------------

    return (
        <Screen showBack={true} style={styles.container}>
            <View style={styles.mapWrap}>
                <MapView
                    style={{flex: 1}}
                    initialRegion={region}
                    showsUserLocation
                >
                    {/* Only admins see cache pin locations */}
                    {isAdmin && caches.map((cache) => (
                        <React.Fragment key={cache.id}>
                            <Marker
                                coordinate={cache.coordinates}
                                title={cache.name || cache.clue}
                                pinColor="#2563eb"
                            />
                            <Circle
                                center={cache.coordinates}
                                radius={cache.radius}
                                fillColor="rgba(59,130,246,0.15)"
                                strokeColor="rgba(59,130,246,0.85)"
                            />
                        </React.Fragment>
                    ))}
                    {/* Heading cone for both admin and player */}
                    {userLocation && heading !== null && (
                        <Marker
                            coordinate={userLocation}
                            flat={true}
                            rotation={heading}
                            anchor={{x: 0.5, y: 1.0}}
                            tracksViewChanges={false}
                        >
                            <View style={styles.coneWrap}>
                                <View style={styles.cone}/>
                            </View>
                        </Marker>
                    )}
                </MapView>
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {padding: 0},
    mapWrap: {flex: 1},
    coneWrap: {width: 22, height: 24, alignItems: 'center'},
    cone: {
        width: 0,
        height: 0,
        borderTopWidth: 24,
        borderLeftWidth: 11,
        borderRightWidth: 11,
        borderTopColor: 'rgba(37,99,235,0.70)',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
});

export default ExpandedMapScreen;
