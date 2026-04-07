import React from 'react';
import {StyleSheet, View} from 'react-native';
import MapView, {Circle, Marker} from 'react-native-maps';

const PlayerMapView = ({ userLocation, visibleCache, heading }) => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

  if (!userLocation) return null;

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
          radius={visibleCache.radius}
          fillColor="rgba(250, 204, 21, 0.20)"
          strokeColor="rgba(250, 204, 21, 0.90)"
        />
      ) : null}
      {heading !== null && heading !== undefined && (
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
  );
};

const styles = StyleSheet.create({
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

export default PlayerMapView;
