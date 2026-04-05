import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import useAuthHook from '../../hooks/useAuthHook';
import Screen from '../layout/Screen';
import {Button, ButtonTray} from '../UI/Button';

const RegisterScreen = ({navigation}) => {
//   Initialisation ------------

    const {
        username, email, password, confirmPassword, accountType,
        error, isLoading,
        setUsername, setEmail, setPassword, setConfirmPassword, setAccountType,
        register,
    } = useAuthHook();

//   State ----------------------

    const [submitting, setSubmitting] = useState(false);

//   Handlers -------------------

    const handleRegister = async () => {
        setSubmitting(true);
        const user = await register();
        setSubmitting(false);
        if (!user) return;
        if (user.IsAcceptedAdmin) {
            navigation.reset({index: 0, routes: [{name: 'Admin'}]});
            return;
        }
        navigation.reset({index: 0, routes: [{name: 'Game'}]});
    };

//   View -----------------------

    return (
        <Screen style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Create Account</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    editable={!isLoading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    editable={!isLoading}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!isLoading}
                />

                <View style={styles.typeRow}>
                    <Pressable
                        style={[styles.typeButton, accountType === 'Individual' && styles.typeButtonActive]}
                        onPress={() => setAccountType('Individual')}
                        disabled={isLoading}
                    >
                        <Text style={[styles.typeText, accountType === 'Individual' && styles.typeTextActive]}>
                            Individual
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.typeButton, accountType === 'Business/School' && styles.typeButtonActive]}
                        onPress={() => setAccountType('Business/School')}
                        disabled={isLoading}
                    >
                        <Text style={[styles.typeText, accountType === 'Business/School' && styles.typeTextActive]}>
                            Business
                        </Text>
                    </Pressable>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <ButtonTray>
                    <Button
                        label={submitting ? 'Creating...' : 'Create Account'}
                        onClick={handleRegister}
                        styleButton={styles.submitButton}
                        styleLabel={styles.submitText}
                    />
                </ButtonTray>

                <Pressable onPress={() => navigation.navigate('Auth', {screen: 'LoginScreen'})}>
                    <Text style={styles.linkText}>Back to Login</Text>
                </Pressable>
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
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        alignItems: 'center',
        paddingVertical: 10,
    },
    typeButtonActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    typeText: {
        color: '#1f2937',
        fontWeight: '600',
    },
    typeTextActive: {
        color: '#ffffff',
    },
    errorText: {
        color: '#dc2626',
        textAlign: 'center',
        marginTop: 5,
    },
    submitButton: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    submitText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    linkText: {
        textAlign: 'center',
        color: '#2563eb',
        fontWeight: '600',
        paddingVertical: 10,
    },
});

export default RegisterScreen;
