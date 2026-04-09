import { ScrollView, StyleSheet } from "react-native";
import CacheItem from "./CacheItem";

const CacheList = ({ caches, foundCacheIds, onSelect }) => {
  // Initialisations ---------------------
  // State -------------------------------
  // Handlers ----------------------------
  // View --------------------------------

  return (
    <ScrollView style={styles.container}>
      {caches.map((cache) => (
        <CacheItem
          key={cache.CacheID}
          cache={cache}
          isFound={foundCacheIds.includes(cache.CacheID)}
          onSelect={onSelect}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {},
});

export default CacheList;
