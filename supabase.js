import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://juyastfivdbgjhylzsey.supabase.co'
const supabaseKey = 'seyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eWFzdGZpdmRiZ2poeWx6c2V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTQ4MTYsImV4cCI6MjA5NDIzMDgxNn0.k1OgeWZIhrOMp6u7KzahjzH-bGAuoc7-rmyiRKfWXT8'

export const supabase = createClient(supabaseUrl, supabaseKey)

const {createClient} = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);


