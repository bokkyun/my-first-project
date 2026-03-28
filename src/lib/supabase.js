import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qrucuqdehrdqgsunfwfd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydWN1cWRlaHJkcWdzdW5md2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MTAxMzEsImV4cCI6MjA5MDE4NjEzMX0.tfu9Q3Ij9PD1bZx34ahmr-XraaQibPRXUSlsTkHG67k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
