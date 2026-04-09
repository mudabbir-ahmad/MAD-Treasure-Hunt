import React from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Marker, Polygon} from 'react-native-maps';
import {getFovCone} from '../../utils/geoMath';

const PlayerMapView = ({userLocation, visibleCaches, heading}) => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    if (!userLocation) return null;

    const coneCoords = (heading !== null && heading !== undefined)
        ? getFovCone(userLocation, heading)
        : null;

    return (
        <MapView
            style={{flex: 1}}
            provider="google"
            initialRegion={{...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation
        >
            {/* Cache pin markers — appear temporarily when the cache is in the FOV
                cone AND within claim distance. Uses a custom View so the pin
                renders identically on iOS (Google Maps) and Android.
                tracksViewChanges must be true so Android captures the custom
                View as a bitmap on the first render cycle. */}
            {(visibleCaches || []).map((cache) => (
                <Marker
                    key={cache.id}
                    coordinate={cache.coordinates}
                    title={cache.clue}
                    anchor={{x: 0.5, y: 0.5}}
                    tracksViewChanges={true}
                >
                    <View style={styles.markerOuter}>
                        <View style={styles.markerInner} />
                    </View>
                </Marker>
            ))}
            {/* FOV heading cone */}
            {coneCoords && (
                <Polygon
                    coordinates={coneCoords}
                    fillColor="rgba(66,133,244,0.28)"
                    strokeColor="rgba(66,133,244,0.50)"
                    strokeWidth={1}
                />
            )}
        </MapView>
    );
};

const styles = StyleSheet.create({
    markerOuter: {
        width: 26,
        height: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerInner: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#f59e0b',
        borderWidth: 2.5,
        borderColor: '#ffffff',
        shadowColor: '#000000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 3,
    },
});

export default PlayerMapView;
