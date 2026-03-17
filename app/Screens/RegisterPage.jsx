import React, { useState } from 'react';
import { View, Text, TextInput, Button, Picker } from 'react-native';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('Individual');

  const handleRegister = () => {
    // Registration logic here
  };

  return (
    <View>
      <Text>Register</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      <Picker selectedValue={userType} onValueChange={(itemValue) => setUserType(itemValue)}>
        <Picker.Item label="Individual" value="Individual" />
        <Picker.Item label="Business/School" value="Business/School" />
      </Picker>
      <Button title="Register" onPress={handleRegister} />
    </View>
  );
};

export default RegisterPage;
