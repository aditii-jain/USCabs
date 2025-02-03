import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Profile, Payment, UserWithPayment } from '../types/database';

export default function Split() {
  const router = useRouter();
  const { carId, totalAmount } = useLocalSearchParams<{ carId: string; totalAmount: string }>();
  const [users, setUsers] = useState<UserWithPayment[]>([]);
  const [splitAmount, setSplitAmount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user's ID on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  // Get payment status for other users only
  const getPaymentStatus = (userId: string) => {
    return users.find(user => user.id === userId)?.hasPaid || false;
  };

  useEffect(() => {
    const fetchGroupMembers = async () => {
      try {
        // Get car data with user IDs
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('user_ids')
          .eq('id', carId)
          .single();

        if (carError) throw carError;

        // Get profiles for all users except current user
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, venmo_username, updated_at, usc_email')
          .in('id', carData.user_ids)
          .neq('id', currentUserId); // Exclude current user

        if (profilesError) throw profilesError;

        const amount = parseFloat(totalAmount);
        // Split amount by total number of users (including current user)
        const perPersonAmount = amount / carData.user_ids.length;

        setUsers(profiles.map(profile => ({
          ...profile,
          hasPaid: false
        })));
        setSplitAmount(perPersonAmount);

      } catch (error) {
        console.error('Error fetching group members:', error);
      }
    };

    if (currentUserId) { // Only fetch when we have the current user's ID
      fetchGroupMembers();
    }
  }, [carId, totalAmount, currentUserId]);

  const togglePayment = async (userId: string) => {
    try {
      // Update local state immediately
      setUsers(users.map(user => 
        user.id === userId ? { ...user, hasPaid: !user.hasPaid } : user
      ));

      // Check if everyone has paid
      const allPaid = users.every(user => 
        user.id === userId ? !user.hasPaid : user.hasPaid
      );

      if (allPaid) {
        // Pass carId when navigating to closing screen
        router.push({
          pathname: '/closing',
          params: { carId }
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Revert local state if failed
      setUsers(users.map(user => 
        user.id === userId ? { ...user, hasPaid: !user.hasPaid } : user
      ));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Image 
            source={require('../assets/images/car.png')} 
            style={styles.headerIcon} 
          />
          <Text style={styles.header}>
            lyft charged you ${totalAmount}
          </Text>
        </View>

        <View style={styles.headerRow}>
          <Image 
            source={require('../assets/images/split.png')} 
            style={styles.headerIcon} 
          />
          <Text style={styles.subheader}>
            splitting {users.length + 1} ways... {/* +1 for current user */}
          </Text>
        </View>

        <View style={styles.arrowContainer}>
          <Image 
            source={require('../assets/images/arrow.png')} 
            style={styles.arrowIcon} 
          />
        </View>

        <Text style={styles.amount}>
          requesting ${splitAmount.toFixed(2)} from everyone
        </Text>
      </View>

      <Text style={styles.listHeader}>
        let us know who paid you back...
      </Text>

      <ScrollView style={styles.userList}>
        {users.map((user) => (
          <TouchableOpacity 
            key={user.id} 
            style={styles.userRow}
            onPress={() => togglePayment(user.id)}
          >
            <View style={styles.userInfo}>
              <Image 
                source={require('../assets/images/user.png')} 
                style={styles.userIcon} 
              />
              <Text style={styles.userName}>{user.venmo_username}</Text>
            </View>
            <View style={[
              styles.checkmark,
              user.hasPaid ? styles.paid : styles.unpaid
            ]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerSection: {
    marginBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  arrowIcon: {
    width: 40,
    height: 40,
    tintColor: '#666',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subheader: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 15,
  },
  listHeader: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  userList: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkmark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  paid: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  unpaid: {
    backgroundColor: 'transparent',
    borderColor: '#ccc',
  },
}); 