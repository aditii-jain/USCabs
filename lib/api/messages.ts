// lib/api/messages.ts

import { supabase } from "../supabase";

export const fetchMessages = async (carId: string) => {
  return await supabase
    .from("messages")
    .select("*")
    .eq("car_id", carId)
    .order("sent_at", { ascending: true });
};

export const sendMessage = async (carId: string, userId: string, content: string) => {
  return await supabase.from("messages").insert({ car_id: carId, user_id: userId, content });
};