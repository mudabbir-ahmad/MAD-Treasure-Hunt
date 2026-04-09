import {Alert, Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {clearGameSession, clearGlobalSession, getSession, setSessionMode} from '../../hooks/SessionStore';
import API, {API_BASE_URL} from '../API/API';
import {GAME_MODE} from '../../utils/gameConstants';

const iconMap = {
  Settings: require('../../../assets/icons/settings-icon.png'),
  Events: require('../../../assets/icons/events-icon.png'),
  Map: require('../../../assets/icons/Map-icon.png'),
  Leaderboard: require('../../../assets/icons/Leaderboard-icon.png'),
  Team: require('../../../assets/icons/Teams-icon.png'),
  Players: require('../../../assets/icons/Teams-icon.png'),
};

const BottomNavbar = ({navigation, routeName, routeParams}) => {
  //   Initialisation ------------

  const insets = useSafeAreaInsets();
  const session = getSession();
  const inGame = Boolean(session.currentGid);
  const isGlobalMode = !session.isBusiness && session.currentGameMode === GAME_MODE.GLOBAL;

  const selectedDepartment = routeName === 'DepartmentSettingsScreen' && routeParams?.SGid
    ? {
      SGid: routeParams.SGid,
      SubGroupName: routeParams.SubGroupName || routeParams.selectedDepartmentName || 'Department',
    }
    : null;

  //   State ----------------------
  //   Handlers -------------------

  const handleLeaveGame = () => {
    Alert.alert('Leave Game', 'Are you sure you want to leave this game?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          const currentSession = getSession();
          const endpoint = `${API_BASE_URL}/subgroup-members?Uid=${currentSession.currentUid}&Gid=${currentSession.currentGid}`;
          const response = await API.get(endpoint);
          if (response.isSuccess && response.result.length > 0) {
            await API.delete(`${API_BASE_URL}/subgroup-members/${response.result[0].id}`);
          }
          clearGameSession();
          const rootNav = navigation.getParent() || navigation;
          rootNav.reset({index: 0, routes: [{name: 'Game'}]});
        },
      },
    ]);
  };

  const handleExitGlobal = () => {
    clearGlobalSession();
    setSessionMode(session.currentGid ? GAME_MODE.REGULAR : null);
    navigation.navigate('MapScreen');
  };

  const adminTabs = [
    {label: 'Settings', route: 'GameSettingsScreen', onPress: () => navigation.navigate('GameSettingsScreen')},
    {
      label: 'Map',
      route: 'MapScreen',
      onPress: () => navigation.navigate('MapScreen', {
        selectedDepartmentSGid: null,
        selectedDepartmentName: null,
      }),
    },
    {
      label: 'Players',
      route: 'PlayersScreen',
      onPress: () => navigation.navigate('PlayersScreen', selectedDepartment ? {department: selectedDepartment} : undefined),
    },
    {
      label: 'Leaderboard',
      route: 'LeaderboardScreen',
      onPress: () => navigation.navigate('LeaderboardScreen', selectedDepartment ? {department: selectedDepartment} : undefined),
    },
  ];

  const playerTabs = [
    {label: 'Team', route: 'TeamScreen', onPress: () => navigation.navigate('TeamScreen')},
    {label: 'Map', route: 'MapScreen', onPress: () => navigation.navigate('MapScreen')},
    {label: 'Leaderboard', route: 'LeaderboardScreen', onPress: () => navigation.navigate('LeaderboardScreen')},
    ...(inGame ? [{label: 'Leave', route: '__leave__', onPress: handleLeaveGame}] : []),
  ];

  const pendingTabs = [
    {label: 'Pending', route: 'TeamScreen', onPress: () => navigation.navigate('TeamScreen')},
    ...(inGame ? [{label: 'Leave', route: '__leave__', onPress: handleLeaveGame}] : []),
  ];

  const globalTabs = [
    {label: 'Events', route: 'GlobalEventsScreen', onPress: () => navigation.navigate('GlobalEventsScreen')},
    {label: 'Map', route: 'GlobalMapScreen', onPress: () => navigation.navigate('GlobalMapScreen')},
    {label: 'Leaderboard', route: 'GlobalLeaderboardScreen', onPress: () => navigation.navigate('GlobalLeaderboardScreen')},
    {label: 'Exit', route: '__exit_global__', onPress: handleExitGlobal},
  ];

  let visibleTabs = session.isAcceptedAdmin ? adminTabs : playerTabs;
  if (session.isPendingAdmin && !session.isAcceptedAdmin) {
    visibleTabs = pendingTabs;
  }
  if (isGlobalMode) {
    visibleTabs = globalTabs;
  }

  //   View -----------------------

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      {visibleTabs.map((tab) => {
        const isActive = routeName === tab.route;
        const isLeave = tab.route === '__leave__';
        const isExitGlobal = tab.route === '__exit_global__';
        const iconSource = iconMap[tab.label];

        return (
          <Pressable
            key={tab.label}
            onPress={tab.onPress}
            style={[styles.tab, isActive && styles.tabActive, (isLeave || isExitGlobal) && styles.tabLeave]}
          >
            {iconSource ? <Image source={iconSource} style={styles.icon} resizeMode="contain" /> : null}
            <Text style={[styles.tabText, isActive && styles.tabTextActive, (isLeave || isExitGlobal) && styles.tabTextLeave]}>
              {tab.label}
            </Text>
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
    borderTopColor: '#45475a',
    backgroundColor: '#313244',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#45475a',
  },
  tabLeave: {
    backgroundColor: 'rgba(217, 40, 0, 0.15)',
  },
  icon: {
    width: 16,
    height: 16,
    opacity: 0.95,
  },
  tabText: {
    color: '#bac2de',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#cdd6f4',
  },
  tabTextLeave: {
    color: '#ffffff',
  },
});

export default BottomNavbar;
