import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { extractPriceFromImage } from '../lib/api/priceExtraction';

export default function Verification() {
  const { carId } = useLocalSearchParams<{ carId: string }>();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [price, setPrice] = useState<number | null>(null);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await analyzeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const analyzeImage = async (imageUri: string) => {
    if (!carId) {
      Alert.alert('Error', 'No car ID provided');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting image analysis...');
      const extractedPrice = await extractPriceFromImage(imageUri);
      
      if (extractedPrice) {
        setPrice(extractedPrice);
        router.push({
          pathname: '/split',
          params: {
            carId: carId,
            totalAmount: extractedPrice.toString()
          }
        });
      } else {
        console.log('No price found in image');
        Alert.alert(
          'No Price Found',
          'Could not detect a price in the image. Please try again with a clearer image.'
        );
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert(
        'Error',
        'Failed to analyze the image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Upload a screenshot of your booking for verification
      </Text>

      <TouchableOpacity 
        style={styles.uploadButton} 
        onPress={pickImage}
        disabled={loading}
      >
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        )}
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ccc" />
          <Text>Analyzing image...</Text>
        </View>
      )}

      {price && (
        <Text style={styles.priceText}>
          Detected Price: ${price.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 18,
    color: '#666',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
}); 