// Database types based on your Supabase schema
export interface Profile {
  id: string;
  updated_at: string;
  usc_email: string;
  full_name: string;
  venmo_username: string;
}

export interface Car {
  id: string;
  departure_time: string;
  user_ids: string[];
  max_capacity: number;
  airport_id: string;
  terminal_id: string;
}

export interface Message {
  id: string;
  content: string;
  sent_at: string;
  user_id: string;
  car_id: string;
}

export interface Airport {
  id: string;
  name: string;
}

export interface Terminal {
  id: string;
  name: string;
  airport_id: string;
}

// Additional types for the payments feature
export interface Payment {
  id: string;
  car_id: string;
  user_id: string;
  amount: number;
  has_paid: boolean;
  created_at: string;
  updated_at: string;
}

// Helper types for components
export interface UserWithPayment extends Profile {
  hasPaid?: boolean;
} 