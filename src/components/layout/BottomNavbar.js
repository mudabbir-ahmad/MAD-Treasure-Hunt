import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {clearGameSession, getSession} from '../../hooks/SessionStore';
import API, {API_BASE_URL} from '../API/API';

const BottomNavbar = ({navigation, routeName, routeParams}) => {
//   Initialisation ------------

    const insets = useSafeAreaInsets();
    const session = getSession();

    const selectedDepartment = routeName === 'DepartmentSettingsScreen' && routeParams?.SGid
        ? {SGid: routeParams.SGid, SubGroupName: routeParams.SubGroupName || routeParams.selectedDepartmentName || 'Department'}
        : null;

    const adminTabs = [
        {label: 'Settings', route: 'GameSettingsScreen', onPress: () => navigation.navigate('GameSettingsScreen')},
        {label: 'Map', route: 'MapScreen', onPress: () => navigation.navigate('MapScreen')},
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

    // Only show the Leave tab when the player is actually in a game
    const inGame = Boolean(session.currentGid);

    const playerTabs = [
        {label: 'Team', route: 'TeamScreen', onPress: () => navigation.navigate('TeamScreen')},
        {label: 'Map', route: 'MapScreen', onPress: () => navigation.navigate('MapScreen')},
        {label: 'Leaderboard', route: 'LeaderboardScreen', onPress: () => navigation.navigate('LeaderboardScreen')},
        ...(inGame ? [{label: 'Leave', route: '__leave__', onPress: () => handleLeaveGame()}] : []),
    ];

    const tabs = session.isAcceptedAdmin ? adminTabs : playerTabs;

//   State ----------------------
//   Handlers -------------------

    const handleLeaveGame = () => {
        Alert.alert('Leave Game', 'Are you sure you want to leave this game?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Leave',
                style: 'destructive',
                onPress: async () => {
                    const s = getSession();
                    const endpoint = `${API_BASE_URL}/subgroup-members?Uid=${s.currentUid}&Gid=${s.currentGid}`;
                    const res = await API.get(endpoint);
                    if (res.isSuccess && res.result.length > 0) {
                        await API.delete(`${API_BASE_URL}/subgroup-members/${res.result[0].id}`);
                    }
                    clearGameSession();
                    navigation.reset({index: 0, routes: [{name: 'Game'}]});
                },
            },
        ]);
    };

//   View -----------------------

    return (
        <View style={[styles.container, {paddingBottom: insets.bottom}]}>
            {tabs.map((tab) => {
                const isActive = routeName === tab.route;
                const isLeave = tab.route === '__leave__';
                return (
                    <Pressable
                        key={tab.label}
                        onPress={tab.onPress}
                        style={[styles.tab, isActive && styles.tabActive, isLeave && styles.tabLeave]}
                    >
                        <Text style={[styles.tabText, isActive && styles.tabTextActive, isLeave && styles.tabTextLeave]}>
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
        paddingVertical: 12,
        borderRadius: 8,
        marginHorizontal: 4,
    },
    tabActive: {
        backgroundColor: '#45475a',
    },
    tabLeave: {
        backgroundColor: 'rgba(243, 139, 168, 0.15)',
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
        color: '#f38ba8',
    },
});

export default BottomNavbar;
