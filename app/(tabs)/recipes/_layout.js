import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { router, Stack } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const RecipesLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="RecipesHome"
        options={{
          headerTitle: 'Recipes',
          headerRight: () => {
            return (
              <Button
                onPress={() => router.push('recipes/create')}
                style={{ paddingRight: 15 }}
                title="Add Recipe"
              />
            );
          },
        }}
      />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="create"
        options={{
          title: 'Add a new recipe',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
};

export default RecipesLayout;

const styles = StyleSheet.create({});
