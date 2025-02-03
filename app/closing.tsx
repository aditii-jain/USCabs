import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function Closing() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/home');
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

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