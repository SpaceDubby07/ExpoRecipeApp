import { Button, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="UserHome"
        options={{
          headerTitle: 'User',
          headerRight: () => (
            <Button
              title="Sign Out"
              onPress={() => {
                AsyncStorage.removeItem('auth');
                router.replace('/(auth)/login');
              }}
            />
          ),
        }}
      />
    </Stack>
  );
};

export default UserLayout;

const styles = StyleSheet.create({});
