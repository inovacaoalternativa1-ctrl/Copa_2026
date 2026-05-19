import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

console.log('[Supabase] URL loaded:', supabaseUrl || 'UNDEFINED - check .env');
console.log('[Supabase] Key loaded:', supabaseKey ? `${supabaseKey.slice(0, 20)}...${supabaseKey.slice(-10)} (${supabaseKey.length} chars)` : 'UNDEFINED - check .env');

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing env vars. Make sure REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY are set in .env and restart the dev server.');
}

const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
