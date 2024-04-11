import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import 'core-js/stable/atob';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateRecipe = () => {
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [images, setImages] = useState([]);
  const [showcaseIndex, setShowcaseIndex] = useState(-1); // Initially no showcase image selected

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleIngredientChange = (index, value) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients[index] = value;
    setIngredients(updatedIngredients);
  };

  const handleRemoveIngredient = (index) => {
    const updatedIngredients = [...ingredients];
    updatedIngredients.splice(index, 1);
    setIngredients(updatedIngredients);
  };

  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleInstructionChange = (index, value) => {
    const updatedInstructions = [...instructions];
    updatedInstructions[index] = value;
    setInstructions(updatedInstructions);
  };

  const handleRemoveInstruction = (index) => {
    const updatedInstructions = [...instructions];
    updatedInstructions.splice(index, 1);
    setInstructions(updatedInstructions);
  };

  const handleImagePicker = async () => {
    // Request camera roll permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    // Open the image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map((asset) => asset.uri)]);
    }
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  const handleSelectShowcaseImage = (index) => {
    setShowcaseIndex(index === showcaseIndex ? -1 : index); // Toggle showcase image selection
  };

  const handleSubmit = async () => {
    try {
      if (showcaseIndex === -1) {
        // If not selected, show an alert to the user
        alert('Please select a showcase image.');
        return; // Exit the function
      }
      // Get the user ID from AsyncStorage
      const token = await AsyncStorage.getItem('auth');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;

      // Create a FormData object to hold the recipe data and images
      const formData = new FormData();
      formData.append('title', title);
      formData.append('ingredients', JSON.stringify(ingredients));
      formData.append('instructions', JSON.stringify(instructions));
      formData.append('createdBy', userId);
      // Add the showcase image index to the FormData object
      formData.append('showcaseIndex', showcaseIndex);

      // Add the images to the FormData object
      for (const image of images) {
        const uniqueFilename = `image-${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.jpg`;

        formData.append('images', {
          uri: image,
          type: 'image/jpeg',
          name: `${uniqueFilename}.jpg`,
        });
      }

      console.log(formData);
      // Send the recipe data to the server
      const response = await axios.post(
        'http://192.168.0.102:3000/recipe',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Reset the form fields or navigate to a different screen
      setTitle('');
      setIngredients([]);
      setInstructions([]);
      setImages([]);
      setShowcaseIndex(-1); // Reset showcase index
    } catch (error) {
      console.error('Error creating recipe:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Recipe Title"
            placeholderTextColor="gray"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientContainer}>
              <TextInput
                style={{ ...styles.input, flex: 1 }}
                placeholder={`Ingredient ${index + 1}`}
                value={ingredient}
                placeholderTextColor="gray"
                onChangeText={(value) => handleIngredientChange(index, value)}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveIngredient(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddIngredient}
          >
            <Text style={styles.addButtonText}>Add Ingredient</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionContainer}>
              <TextInput
                style={{ ...styles.input, ...styles.multiline, flex: 1 }}
                placeholder={`Step ${index + 1}`}
                placeholderTextColor="gray"
                multiline
                value={instruction}
                onChangeText={(value) => handleInstructionChange(index, value)}
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveInstruction(index)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddInstruction}
          >
            <Text style={styles.addButtonText}>Add Step</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.sectionTitle}>Images</Text>
            <Text style={{ fontSize: 12 }}>Click an image to showcase</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleImagePicker}
          >
            <Text style={styles.addButtonText}>Add Image</Text>
          </TouchableOpacity>
          <View style={styles.imageContainer}>
            {images.map((image, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.imageWrapper,
                  showcaseIndex === index && {
                    borderColor: 'green',
                    borderWidth: 3,
                    borderRadius: 10,
                  }, // Highlight selected showcase image
                ]}
                onPress={() => handleSelectShowcaseImage(index)}
              >
                <Image source={{ uri: image }} style={styles.image} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageButtonText}>Remove</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  multiline: {
    height: 60,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#0061ED',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  ingredientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: '30%',
    height: 100,
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.8)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 26,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CreateRecipe;
