import React from 'react';
import MapView, {Circle, Marker} from 'react-native-maps';

const AdminCacheEditorView = ({ userLocation, caches, claimDistance, onAddCache, onMoveCache }) => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

  if (!userLocation) {
    return null;
  }

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      onLongPress={(event) => onAddCache(event.nativeEvent.coordinate)}
      scrollEnabled={true}
      zoomEnabled={true}
      showsUserLocation
    >
      {(caches || []).map((cache) => (
        <React.Fragment key={cache.id}>
          <Marker
            coordinate={cache.coordinates}
            draggable
            onDragEnd={(event) => onMoveCache(cache.id, event.nativeEvent.coordinate)}
            title={`Cache ${cache.id}`}
          />
          <Circle
            center={cache.coordinates}
            radius={claimDistance}
            fillColor="rgba(59, 130, 246, 0.15)"
            strokeColor="rgba(59, 130, 246, 0.85)"
          />
        </React.Fragment>
      ))}
    </MapView>
  );
};

export default AdminCacheEditorView;

