import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmailForm from '../../components/EmailForm';

export default function SignIn() {
  return (
    <View style={styles.container}>
      <EmailForm type="signin" />
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
});