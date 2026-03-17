import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

const EntityCard = ({
  title,
  subtitle,
  metaLabel1,
  metaValue1,
  metaLabel2,
  metaValue2,
  metaLabel3,
  metaValue3,
  onPress,
}) => {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.metaContainer}>
        {metaLabel1 && metaValue1 && (
          <Text style={styles.metaText}>{metaLabel1}: {metaValue1}</Text>
        )}
        {metaLabel2 && metaValue2 && (
          <Text style={styles.metaText}>{metaLabel2}: {metaValue2}</Text>
        )}
        {metaLabel3 && metaValue3 && (
          <Text style={styles.metaText}>{metaLabel3}: {metaValue3}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  metaContainer: {
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#4b5563',
  },
});

export default EntityCard;

