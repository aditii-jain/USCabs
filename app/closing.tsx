import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function Closing() {
  const router = useRouter();
  const { carId } = useLocalSearchParams<{ carId: string }>();

  useEffect(() => {
    const cleanup = async () => {
      try {
        // Make sure carId is valid
        if (!carId) {
          console.error('No carId provided');
          router.replace('/home'); // Redirect to home if no carId
          return;
        }

        // Call the database function with the correct parameter name
        const { error } = await supabase
          .rpc('delete_car_and_associated_data', {
            car_id_param: carId
          });

        if (error) {
          console.error('Error cleaning up car data:', error);
          Alert.alert('Error', 'Failed to cleanup chat data');
          router.replace('/home');
          return;
        }
      } catch (error) {
        console.error('Error in cleanup:', error);
      }
    };

    // Perform cleanup
    cleanup();

    // Set timeout to navigate back to home
    const timeout = setTimeout(() => {
      router.replace('/home');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [carId, router]);

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Image 
          source={require('../assets/images/received.png')} 
          style={styles.icon} 
        />
        <Text style={styles.text}>received venmos from everyone!</Text>
      </View>

      <View style={styles.messageContainer}>
        <Image 
          source={require('../assets/images/chat.png')} 
          style={styles.icon} 
        />
        <Text style={styles.text}>ending chat</Text>
      </View>

      <View style={styles.messageContainer}>
        <Image 
          source={require('../assets/images/house.png')} 
          style={styles.icon} 
        />
        <Text style={styles.text}>taking you back to home screen...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  icon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  text: {
    fontSize: 20,
    color: '#666',
  },
}); 