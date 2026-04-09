import MapView, { Marker, Polygon } from "react-native-maps";
import { getFovCone } from "../../utils/geoMath";

const PlayerMapView = ({ userLocation, visibleCaches, heading }) => {
  if (!userLocation) return null;

  const coneCoords =
    heading !== null && heading !== undefined
      ? getFovCone(userLocation, heading)
      : null;

  return (
    <MapView
      style={{ flex: 1 }}
      provider="google"
      initialRegion={{
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      scrollEnabled={true}
      zoomEnabled={true}
      rotateEnabled={false}
      pitchEnabled={false}
      showsUserLocation
    >
      {(visibleCaches || []).map((cache) => (
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
  );
};

export default PlayerMapView;
