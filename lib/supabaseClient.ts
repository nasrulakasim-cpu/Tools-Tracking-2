import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://jpdnaavclcoonsqfgpju.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZG5hYXZjbGNvb25zcWZncGp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0Mzk2NTAsImV4cCI6MjA4MTAxNTY1MH0.p-TSiaJ4cTCHi89LTfb-9tUnFOBe4CAWJEPlRToQO_o';

export const supabase = createClient(PROJECT_URL, API_KEY);