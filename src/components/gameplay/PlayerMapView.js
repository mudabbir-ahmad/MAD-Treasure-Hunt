import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import MapView, {Circle, Marker, Polygon} from 'react-native-maps';
import {getFovCone} from '../../utils/geoMath';

const PlayerMapView = ({userLocation, visibleCaches, heading, claimDistance}) => {
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
            {/* Cache markers — uses a custom View instead of pinColor so the
                marker renders identically on Apple Maps (iOS) and Google Maps */}
            {(visibleCaches || []).map((cache) => (
                <React.Fragment key={cache.id}>
                    <Marker
                        coordinate={cache.coordinates}
                        title={cache.clue}
                        anchor={{x: 0.5, y: 0.5}}
                        tracksViewChanges={Platform.OS === 'ios'}
                    >
                        <View style={styles.markerOuter}>
                            <View style={styles.markerInner} />
                        </View>
                    </Marker>
                    <Circle
                        center={cache.coordinates}
                        radius={claimDistance}
                        fillColor="rgba(250, 204, 21, 0.20)"
                        strokeColor="rgba(250, 204, 21, 0.90)"
                    />
                </React.Fragment>
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
