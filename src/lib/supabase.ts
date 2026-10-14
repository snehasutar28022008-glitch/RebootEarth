import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Role = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  role: Role;
  points: number;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Rate {
  id: string;
  category: string;
  grade: string;
  rate: number;
  unit: 'per_kg' | 'per_item';
  last_updated: string;
  created_at: string;
}

export interface GradeFactor {
  id: string;
  grade: 'A' | 'B' | 'C' | 'Hazardous';
  label: string;
  factor: number;
  updated_at: string;
}

export interface AcceptedItem {
  id: string;
  name: string;
  type: 'accepted' | 'special' | 'not_accepted' | 'special_request';
  sort_order: number;
  created_at: string;
}

export interface Fact {
  id: string;
  text: string;
  is_active: boolean;
  sort_order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  sort_order: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  threshold_kg: number;
  threshold_items: number;
}

export interface Zone {
  id: string;
  name: string;
  city: string;
  is_active: boolean;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

export interface Pickup {
  id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'scheduled' | 'collected' | 'completed' | 'cancelled';
  scheduled_date: string | null;
  time_slot: string;
  address: string;
  city: string;
  pincode: string;
  zone_id: string | null;
  total_items: number;
  estimated_value_min: number;
  estimated_value_max: number;
  has_hazardous: boolean;
  notes: string;
  collected_weight_kg: number | null;
  final_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface PickupItem {
  id: string;
  pickup_id: string;
  category: string;
  label: string;
  quantity: number;
  grade: 'A' | 'B' | 'C' | 'Hazardous';
  hazard_level: 'none' | 'hazardous';
  has_battery: boolean;
  estimated_value_min: number;
  estimated_value_max: number;
  unit: 'per_kg' | 'per_item';
  photo_url: string | null;
  created_at: string;
}

export interface StockEntry {
  id: string;
  category: string;
  source: 'pickup' | 'manual';
  pickup_id: string | null;
  weight_kg: number;
  item_count: number;
  grade: 'A' | 'B' | 'C' | 'Hazardous';
  status: 'in_stock' | 'handed_over';
  handover_id: string | null;
  created_at: string;
}

export interface Handover {
  id: string;
  partner_name: string;
  total_weight_kg: number;
  total_items: number;
  total_value: number;
  status: 'dispatched' | 'received' | 'settled';
  notes: string;
  created_at: string;
}

export type OrderStatus = 'submitted' | 'admin_approved' | 'waiting_company_approval' | 'company_approved' | 'rejected' | 'collected';

export interface Company {
  id: string;
  name: string;
  area: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  pickup_address: string;
  pickup_phone: string;
  pickup_date: string | null;
  pickup_slot: string;
  city: string;
  pincode: string;
  total_items: number;
  estimated_value_min: number;
  estimated_value_max: number;
  has_special_request: boolean;
  has_hazardous: boolean;
  company_id: string | null;
  rejection_reason: string;
  points_awarded: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string | null;
  user_id: string;
  category: string;
  name: string;
  image_url: string | null;
  item_type: 'accepted' | 'special_request' | 'not_accepted';
  quantity: number;
  grade: string;
  estimated_value_min: number;
  estimated_value_max: number;
  created_at: string;
}
