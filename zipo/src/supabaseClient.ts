import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sbewwzgvhhhohwxenosk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiZXd3emd2aGhob2h3eGVub3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMjcwMzgsImV4cCI6MjA2NzgwMzAzOH0.4YqMCQatOU8uo_0R40n8xuvPBSNaLRmYtbXO7YFozbI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 