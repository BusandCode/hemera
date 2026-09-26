import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hjekdbhjhndvoeuaermd.supabase.co';
const supabaseAnonKey = 'sb_publishable_rpqAoJIEJurjPAHAIrgnCw_iW-q1fpn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});