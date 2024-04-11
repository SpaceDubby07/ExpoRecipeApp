import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from 'expo-router';

const login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Check the login status, and route to the app if token is valid
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('auth');
        if (token) {
          router.replace('/(tabs)/recipes');
        }
      } catch (error) {
        console.log(error);
      }
    };
    checkLoginStatus();
  }, []);

  const loginHandler = async () => {
    try {
      // Create the user object
      const user = {
        email: email,
        password: password,
      };

      // Initialize axios
      const response = await axios.post(
        'http://192.168.0.102:3000/login',
        user
      );
      const token = response.data.token;
      // Set the token as auth
      AsyncStorage.setItem('auth', token);
      router.replace('/(tabs)/recipes');
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Login</Text>
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
      <TouchableOpacity style={styles.button} onPress={loginHandler}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <Pressable onPress={() => router.replace('(auth)/register')}>
        <Text style={styles.signupLink}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
};

export default login;

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
  signupLink: {
    marginTop: 10,
    color: '#007BFF',
  },
});
