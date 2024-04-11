import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'core-js/stable/atob';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { format } from 'date-fns';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

// Get the user details, and display them
const UserHome = () => {
  const [userId, setUserId] = useState(''); // get the user id
  const [name, setName] = useState('');
  const [email, setUserEmail] = useState(''); // this is for the users
  const [accountCreated, setAccountCreated] = useState(null);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // get the userId
  useEffect(() => {
    // fetch the user
    const fetchUser = async () => {
      // get the token, it's set as 'auth' in storage
      const token = await AsyncStorage.getItem('auth');
      // decode the token
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
    };

    fetchUser();
  }, []);

  // Fetch any of the users details from the database
  const fetchUserDetails = async () => {
    try {
      const response = await axios.get(
        `http://192.168.0.102:3000/user/${userId}`
      );
      const user = response.data;
      const formattedDate = format(new Date(user.createdAt), 'MM/dd/yyyy');

      setName(user?.name);
      setUserEmail(user?.email);
      setAccountCreated(formattedDate);
    } catch (error) {
      console.log(error, 'Error fetching user description');
    }
  };

  // if we have the user id, fetch the user details
  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  useEffect(() => {
    // Fetch favorite recipes from the backend when the component mounts
    fetchFavoriteRecipes();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true); // Start refreshing
    fetchFavoriteRecipes();
  };

  const fetchFavoriteRecipes = async () => {
    try {
      // Get the user ID from AsyncStorage
      const token = await AsyncStorage.getItem('auth');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      // Make an HTTP GET request to fetch favorite recipes for the user
      const response = await axios.get(
        `http://192.168.0.102:3000/users/${userId}/recipes/favorite`
      );

      // Set the fetched favorite recipes in the state
      setFavoriteRecipes(response.data);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
    } finally {
      setIsRefreshing(false); // Finish refreshing
    }
  };

  const renderFavoriteRecipe = ({ item }) => {
    console.log(item);
    return (
      <TouchableOpacity
        onPress={() => {
          router.replace({
            pathname: 'recipes/[id]',
            params: { recipeId: item._id },
          });
        }}
      >
        <View style={styles.listCard}>
          <Text>{item.title}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.text}>{name}</Text>
        <Text style={styles.text}>{email}</Text>
        <Text style={styles.text}>{accountCreated}</Text>
      </View>
      <View style={styles.favoritesContainer}>
        <Text style={styles.favHeaderText}>Favorites</Text>
        <FlatList
          data={favoriteRecipes}
          renderItem={renderFavoriteRecipe}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        />
        {favoriteRecipes.length === 0 && (
          <View style={styles.noFavoritesContainer}>
            <Text style={styles.noFavoritesText}>
              No favorite recipes found
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default UserHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
    elevation: 5, // For Android
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
      },
    }),
  },
  listCard: {
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 20,
    elevation: 5, // For Android
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 1,
      },
    }),
  },
  text: {
    fontSize: 16,
    marginBottom: 10,
  },
  favoritesContainer: {
    flex: 1,
    padding: 10,
  },
  favHeaderText: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 22,
    color: '#000',
    marginBottom: 10,
  },
  noFavoritesContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Align the content at the top of the container
    alignItems: 'center', // Center content horizontally
  },
  noFavoritesText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center', // Center text horizontally
  },
});
