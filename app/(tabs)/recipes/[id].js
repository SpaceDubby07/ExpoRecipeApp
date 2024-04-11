import {
  View,
  Text,
  Button,
  TextInput,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  PlatformColor,
  Platform,
} from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import axios from 'axios';
import { AntDesign } from '@expo/vector-icons';

const SelectedRecipe = () => {
  const navigation = useNavigation();
  const { recipeId } = useLocalSearchParams();
  // Define local state variables to hold the recipe data
  const [editing, setIsEditing] = useState(false);
  const systemColor = PlatformColor('systemBlue');

  const [recipe, setRecipe] = useState({
    title: '',
    ingredients: [],
    instructions: [],
    images: [],
    showcaseImage: '',
    isFavorite: false,
    createdBy: '',
    createdAt: '',
    updatedAt: '',
  });

  // Function to fetch the recipe data from the server
  const fetchRecipeData = async () => {
    // Make an HTTP GET request to fetch the recipe data
    try {
      const response = await axios.get(
        `http://192.168.0.102:3000/recipe/${recipeId}`
      );
      // Update the local state with the fetched recipe data
      setRecipe(response.data);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    }
  };

  // Use useEffect to fetch the recipe data when the component mounts
  useEffect(() => {
    fetchRecipeData();
  }, []);

  const handleFavoritePress = async () => {
    try {
      // Send a PATCH request to your backend API to update the isFavorite field
      await axios.patch(
        `http://192.168.0.102:3000/recipe/${recipeId}/favorite`
      );

      // Update the state of the recipe to reflect the changes
      setRecipe((prevRecipe) => ({
        ...prevRecipe,
        isFavorite: !prevRecipe.isFavorite,
      }));
    } catch (error) {
      console.error('Error marking recipe as favorite:', error);
    }
  };

  const toggleEditing = () => {
    setIsEditing(!editing);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: recipe.title || 'Selected Recipe',

      headerRight: () => {
        return (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {editing ? (
              <Button title="Cancel" onPress={toggleEditing} />
            ) : (
              <AntDesign
                name={recipe.isFavorite ? 'star' : 'staro'}
                size={18}
                color={Platform.OS === 'ios' ? systemColor : 'black'}
                style={{ paddingRight: 20 }}
                onPress={handleFavoritePress}
              />
            )}
            <Button
              title={editing ? 'Save' : 'Edit'}
              onPress={editing ? editRecipe : toggleEditing}
            />
          </View>
        );
      },
    });
  }, [navigation, recipe.title, editing, recipe.isFavorite]);

  const handleInputChange = (field, value) => {
    setRecipe({ ...recipe, [field]: value });
  };

  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = value;
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const handleInstructionChange = (index, value) => {
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions[index] = value;
    setRecipe({ ...recipe, instructions: updatedInstructions });
  };

  const markIngredientForDeletion = (index) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = null; // Mark for deletion
    setRecipe({ ...recipe, ingredients: updatedIngredients });
  };

  const markInstructionForDeletion = (index) => {
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions[index] = null; // Mark for deletion
    setRecipe({ ...recipe, instructions: updatedInstructions });
  };

  const addNewIngredient = () => {
    setRecipe({ ...recipe, ingredients: [...recipe.ingredients, ''] });
  };

  const addNewInstruction = () => {
    setRecipe({ ...recipe, instructions: [...recipe.instructions, ''] });
  };

  // function to save recipe if we edit it...
  const editRecipe = async () => {
    try {
      const updatedRecipeData = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        createdBy: recipe.createdBy,
        // Add other fields as needed
      };

      // Make a PUT request to update the recipe
      const response = await axios.put(
        `http://192.168.0.102:3000/recipe/${recipeId}`,
        updatedRecipeData
      );

      // Set the fetched recipes in the state
      // console.log(response.data);
      setIsEditing(false);
      // router.replace('recipes/RecipesHome');
    } catch (error) {
      console.error('Error editing recipes:', error);
    }
  };

  const deleteRecipe = async () => {
    const recipeForDeletion = {
      images: recipe.images,
      createdBy: recipe.createdBy,
      // Add other fields as needed
    };
    try {
      // Make a DELETE request to the backend API endpoint
      const response = await axios.delete(
        `http://192.168.0.102:3000/recipe/${recipeId}`,
        {
          data: recipeForDeletion,
        }
      );

      // Handle the response if necessary
      console.log(response.data); // Log the response data
      router.replace('recipes/RecipesHome');
    } catch (error) {
      // Handle errors if the request fails
      console.error('Error deleting recipe:', error);
    }
  };

  return (
    <>
      {editing ? (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
            }}
          >
            <Text style={styles.label}>Title:</Text>
            <TextInput
              style={styles.input}
              value={recipe.title}
              onChangeText={(text) => handleInputChange('title', text)}
              placeholder="Title"
            />
            <Text style={styles.label}>Ingredients:</Text>
            {recipe.ingredients.map(
              (ingredient, index) =>
                ingredient !== null && (
                  <View key={index} style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={ingredient}
                      onChangeText={(text) =>
                        handleIngredientChange(index, text)
                      }
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    <Button
                      title="Mark for Deletion"
                      onPress={() => markIngredientForDeletion(index)}
                    />
                  </View>
                )
            )}
            <Button title="Add New Ingredient" onPress={addNewIngredient} />
            <Text style={styles.label}>Instructions:</Text>
            {recipe.instructions.map(
              (instruction, index) =>
                instruction !== null && (
                  <View key={index} style={styles.row}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={instruction}
                      onChangeText={(text) =>
                        handleInstructionChange(index, text)
                      }
                      placeholder={`Step ${index + 1}`}
                    />
                    <Button
                      title="Mark for Deletion"
                      onPress={() => markInstructionForDeletion(index)}
                    />
                  </View>
                )
            )}
            <Button title="Add New Instruction" onPress={addNewInstruction} />
            {/* on press delete recipe, images from cloudinary, reroute to home screen */}
            <Button
              title="Delete Recipe"
              color={'red'}
              onPress={deleteRecipe}
            />
          </ScrollView>
        </View>
      ) : (
        <View
          style={{
            flex: 1,
          }}
        >
          <View>
            <FlatList
              data={[recipe]}
              renderItem={() => (
                <View style={{ flexDirection: 'row', padding: 10 }}>
                  {recipe.images.map((image, index) => (
                    <Image
                      key={index}
                      source={{ uri: image }}
                      style={{
                        height: 200,
                        width: 200,
                        marginHorizontal: 5,
                        borderRadius: 20,
                      }}
                    />
                  ))}
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              horizontal={true}
            />
          </View>

          <View style={{ flex: 1 }}>
            <ScrollView
              contentContainerStyle={{
                paddingVertical: 10,
                paddingHorizontal: 20,
              }}
            >
              <Text style={styles.label}>Ingredients:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {recipe.ingredients.map(
                  (ingredient, index) =>
                    ingredient !== null && (
                      <Text
                        key={index}
                        style={{
                          fontSize: 16,
                          borderRadius: 10,
                          borderWidth: 1,
                          padding: 5,
                          marginRight: 5, // Optional: Add right margin for spacing between ingredients
                          marginBottom: 5, // Optional: Add bottom margin for spacing between rows
                        }}
                      >
                        {ingredient}
                      </Text>
                    )
                )}
              </View>
              <Text style={styles.label}>Instructions:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {recipe.instructions.map(
                  (instruction, index) =>
                    instruction !== null && (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginRight: 10, // Optional: Add right margin for spacing between steps
                          marginBottom: 5, // Optional: Add bottom margin for spacing between rows
                        }}
                      >
                        <Text>{`Step ${index + 1}:`}</Text>
                        <Text
                          style={{
                            padding: 20,
                            marginLeft: 5, // Optional: Add left margin for spacing between step number and text
                          }}
                        >
                          {instruction}
                        </Text>
                      </View>
                    )
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
};

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
};

export default SelectedRecipe;
