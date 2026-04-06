import React from 'react';
import MapView, {Circle} from 'react-native-maps';
import ClaimTimerView from './ClaimTimerView';

const PlayerMapView = ({ userLocation, visibleCache, isClaiming, onClaimSuccess }) => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

  if (!userLocation) return null;

  return (
    <>
      <MapView
        style={{flex: 1}}
        initialRegion={{
          ...userLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
      >
        {visibleCache ? (
          <Circle
            center={visibleCache.coordinates}
            radius={visibleCache.radius}
            fillColor="rgba(250, 204, 21, 0.20)"
            strokeColor="rgba(250, 204, 21, 0.90)"
          />
        ) : null}
      </MapView>

      <ClaimTimerView
        cache={visibleCache}
        isClaiming={isClaiming}
        onClaimSuccess={onClaimSuccess}
      />
    </>
  );
};

export default PlayerMapView;

