import {Pressable, StyleSheet, Text, View} from 'react-native';

const BottomNavbar = ({ navigation, routeName }) => {
  const tabs = [
    {
      label: 'Map',
      route: 'MapScreen',
      onPress: () => navigation.navigate('Game', { screen: 'MapScreen' }),
    },
    {
      label: 'Leaderboard',
      route: 'LeaderboardScreen',
      onPress: () => navigation.navigate('Game', { screen: 'LeaderboardScreen' }),
    },
    {
      label: 'Current Team',
      route: 'TeamScreen',
      onPress: () => navigation.navigate('Game', { screen: 'TeamScreen' }),
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = routeName === tab.route;
        return (
          <Pressable
            key={tab.route}
            onPress={tab.onPress}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#2563eb',
  },
});

export default BottomNavbar;

