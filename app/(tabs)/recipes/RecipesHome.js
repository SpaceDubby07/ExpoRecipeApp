import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import 'core-js/stable/atob';
import { router } from 'expo-router';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  RefreshControl,
  PlatformColor,
} from 'react-native';
import axios from 'axios';

const RecipesHome = () => {
  const [recipes, setRecipes] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const systemColor = PlatformColor('systemBlue');

  useEffect(() => {
    // Fetch recipes from the backend when the component mounts
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      // Get the user ID from AsyncStorage
      const token = await AsyncStorage.getItem('auth');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      // Make an HTTP GET request to fetch recipes for the user
      const response = await axios.get(
        `http://192.168.0.102:3000/users/${userId}/recipes`
      );

      // Set the fetched recipes in the state
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    } finally {
      setIsRefreshing(false); // Finish refreshing
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true); // Start refreshing
    fetchRecipes();
  };

  const handleRecipePress = (recipeId) => {
    // Handle navigation to the recipe details page for editing or deleting
    router.push({
      pathname: 'recipes/[id]',
      params: {
        recipeId: recipeId,
      },
    });
  };

  const renderRecipes = (recipe) => {
    return (
      <TouchableOpacity
        key={recipe.item.id}
        style={styles.recipeButton}
        onPress={() =>
          handleRecipePress(
            recipe.item._id,
            recipe.item.title,
            recipe.item.ingredients,
            recipe.item.instructions,
            recipe.item.images,
            recipe.item.showcaseImage,
            recipe.item.isFavorite,
            recipe.item.createdBy,
            recipe.item.createdAt,
            recipe.item.updatedAt
          )
        }
      >
        <Image
          source={{ uri: recipe.item.showcaseImage }}
          style={styles.recipeImage}
        />
        <Text style={styles.recipeTitle}>{recipe.item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlashList
        data={recipes}
        keyExtractor={(recipe) => recipe._id}
        renderItem={renderRecipes}
        numColumns={2} // Two recipes per row
        estimatedItemSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={systemColor}
          />
        }
      />
    </View>
  );
};

export default RecipesHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  recipeButton: {
    width: '90%', // Adjust width for two recipes per row
    aspectRatio: 1, // Ensure square layout
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
    opacity: 0.4,
    borderRadius: 10,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    textTransform: 'capitalize',
  },
});
