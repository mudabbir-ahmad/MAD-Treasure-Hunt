import React from 'react';
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
            initialRegion={{...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01}}
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation
        >
            {/* Show cache markers for all caches currently inside the FOV cone */}
            {(visibleCaches || []).map((cache) => (
                <React.Fragment key={cache.id}>
                    <Marker
                        coordinate={cache.coordinates}
                        title={cache.clue}
                        pinColor="#facc15"
                    />
                    <Circle
                        center={cache.coordinates}
                        radius={claimDistance}
                        fillColor="rgba(250, 204, 21, 0.20)"
                        strokeColor="rgba(250, 204, 21, 0.90)"
                    />
                </React.Fragment>
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
    );
};

export default PlayerMapView;
