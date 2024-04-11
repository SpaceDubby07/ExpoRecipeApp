import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  TextInput,
  Alert,
  ImageBackground,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const registrationHandler = async () => {
    const user = {
      name: name,
      email: email,
      password: password,
    };

    try {
      axios
        .post('http://192.168.0.102:3000/register', user)
        .then((response) => {
          Alert.alert(
            'Registration Successful, Go Login',
            'Check your email to verify your account',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/login'),
              },
            ]
          );
          setName('');
          setEmail('');
          setPassword('');
        })
        .catch((error) => {
          Alert.alert(
            'Registration Error',
            'An error occurred while registering'
          );
          console.log('registration failed', error);
        });
    } catch (error) {
      console.log('Registration Error', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Register</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        onChangeText={(text) => setName(text)}
        value={name}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        onChangeText={(text) => setEmail(text)}
        value={email}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => setPassword(text)}
        value={password}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={registrationHandler}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <Pressable onPress={() => router.replace('(auth)/login')}>
        <Text style={styles.loginLink}>Already have an account? Login</Text>
      </Pressable>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  loginLink: {
    marginTop: 10,
    color: '#007BFF',
  },
});
