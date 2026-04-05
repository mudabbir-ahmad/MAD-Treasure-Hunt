import {Pressable, StyleSheet, Text, View} from 'react-native';
import {clearSession} from '../../hooks/SessionStore';

const TopNavbar = ({title, showBack, navigation}) => {
//   Initialisation ------------

    const routeName = navigation.getState()?.routes?.[navigation.getState().index]?.name;
    const showLogout = routeName !== 'LoginScreen' && routeName !== 'RegisterScreen';

//   State ----------------------
//   Handlers -------------------

    const handleBack = () => {
        if (navigation.canGoBack()) navigation.goBack();
    };

    const handleLogout = () => {
        clearSession();
        navigation.reset({
            index: 0,
            routes: [{name: 'Auth', params: {screen: 'LoginScreen'}}],
        });
    };

//   View -----------------------

    return (
        <View style={styles.container}>
            <View style={styles.leftSlot}>
                {showBack ? (
                    <Pressable onPress={handleBack} style={styles.iconButton}>
                        <Text style={styles.iconText}>{'<'}</Text>
                    </Pressable>
                ) : null}
            </View>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.rightSlot}>
                {showLogout ? (
                    <Pressable onPress={handleLogout} style={styles.logoutButton}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: 56,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: '#ffffff',
    },
    leftSlot: {
        width: 72,
        alignItems: 'flex-start',
    },
    rightSlot: {
        width: 72,
        alignItems: 'flex-end',
    },
    iconButton: {
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    iconText: {
        fontSize: 20,
        color: '#111827',
        fontWeight: '700',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    logoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    logoutText: {
        color: '#2563eb',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default TopNavbar;
