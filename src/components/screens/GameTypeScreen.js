import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import useGameHook from '../../hooks/useGameHook';
import Screen from '../layout/Screen';

const GameTypeScreen = ({navigation}) => {
//   Initialisation ------------

    const {getGameTypes} = useGameHook();

//   State ----------------------

    const [gameTypes, setGameTypes] = useState([]);

//   Handlers -------------------

    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            const types = await getGameTypes();
            if (isMounted) setGameTypes(types || []);
        };
        load();
        return () => { isMounted = false; };
    }, []);

//   View -----------------------

    return (
        <Screen style={styles.container}>
            <Text style={styles.title}>Select Game Type</Text>
            <View style={styles.content}>
                {gameTypes && gameTypes.map((type) => (
                    <Pressable
                        key={type}
                        style={styles.button}
                        onPress={() => navigation.navigate('GameLobbyScreen')}
                    >
                        <Text style={styles.buttonText}>{type}</Text>
                    </Pressable>
                ))}
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
    },
    content: {
        gap: 12,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default GameTypeScreen;
