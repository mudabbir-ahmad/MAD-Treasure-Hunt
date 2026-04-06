import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {getSession} from '../../hooks/SessionStore';

const BottomNavbar = ({ navigation, routeName }) => {
//   Initialisation ------------

    const insets = useSafeAreaInsets();
    const session = getSession();

    const adminTabs = [
        {
            label: 'Game Settings',
            route: 'GameSettingsScreen',
            onPress: () => navigation.navigate('GameSettingsScreen'),
        },
        {
            label: 'Map',
            route: 'MapScreen',
            onPress: () => navigation.navigate('MapScreen'),
        },
        {
            label: 'Players',
            route: 'PlayersScreen',
            onPress: () => navigation.navigate('PlayersScreen'),
        },
        {
            label: 'Leaderboard',
            route: 'LeaderboardScreen',
            onPress: () => navigation.navigate('LeaderboardScreen'),
        },
    ];

    const playerTabs = [
        {
            label: 'Map',
            route: 'MapScreen',
            onPress: () => navigation.navigate('MapScreen'),
        },
        {
            label: 'Leaderboard',
            route: 'LeaderboardScreen',
            onPress: () => navigation.navigate('LeaderboardScreen'),
        },
        {
            label: 'Current Team',
            route: 'TeamScreen',
            onPress: () => navigation.navigate('TeamScreen'),
        },
    ];

    const tabs = session.isAcceptedAdmin ? adminTabs : playerTabs;

//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    return (
        <View style={[styles.container, {paddingBottom: insets.bottom}]}>
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
        borderTopColor: '#555555',
        backgroundColor: '#4a4a4a',
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
        backgroundColor: '#5c5c5c',
    },
    tabText: {
        color: '#d1d5db',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#ffffff',
    },
});

export default BottomNavbar;
