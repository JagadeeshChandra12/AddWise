import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tdylojqfgcchpfdbroaq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeWxvanFmZ2NjaHBmZGJyb2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDgzNzcsImV4cCI6MjA2MzU4NDM3N30.7cIRkgYx5lWUT2hBt9kxti7dYfw2j5vOapQiLuaaZ3w';

export const supabase = createClient(supabaseUrl, supabaseKey); 