import React from 'react';
import {StyleSheet, Text} from 'react-native';
import Screen from '../layout/Screen';

const LeaderboardScreen = () => {
//   Initialisation -------------
//   State ----------------------
//   Handlers -------------------
//   View -----------------------

    return (
        <Screen style={styles.container}>
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.body}>Leaderboard view goes here.</Text>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {justifyContent: 'center', alignItems: 'center'},
    title: {fontSize: 24, fontWeight: 'bold'},
    body: {color: '#4b5563', fontSize: 15, marginTop: 10},
});

export default LeaderboardScreen;
