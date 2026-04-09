import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {clearSession} from '../../hooks/SessionStore';

const TopNavbar = ({title, showBack, navigation}) => {
//   Initialisation ------------

    const insets = useSafeAreaInsets();

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
        <View style={[styles.container, {paddingTop: insets.top}]}>
            <View style={styles.leftSlot}>
                {showBack ? (
                    <Pressable onPress={handleBack} style={styles.iconButton}>
                        <Text style={styles.iconText}>{'<'}</Text>
                    </Pressable>
                ) : null}
            </View>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.rightSlot}>
                <Pressable onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: 56,
        borderBottomWidth: 1,
        borderBottomColor: '#45475a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        backgroundColor: '#313244',
        zIndex: 10,
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
        color: '#ffffff',
        fontWeight: '700',
    },
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    logoutButton: {
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    logoutText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default TopNavbar;
