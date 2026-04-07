import React from 'react';
import MapView, {Circle, Polygon} from 'react-native-maps';
import {getFovCone} from '../../utils/geoMath';

const PlayerMapView = ({ userLocation, visibleCache, heading, claimDistance }) => {
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
      region={{
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={true}
      rotateEnabled={false}
      pitchEnabled={false}
      showsUserLocation
    >
      {visibleCache ? (
        <Circle
          center={visibleCache.coordinates}
          radius={claimDistance}
          fillColor="rgba(250, 204, 21, 0.20)"
          strokeColor="rgba(250, 204, 21, 0.90)"
        />
      ) : null}
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
