import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vshamisexmjcymsdyhym.supabase.co/';
const supabaseKey = 'sb_publishable_viPzmZUj0b2sbHlyWAnz5Q_PntK9O03';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Supabase URL:", supabaseUrl);
  
  const { data: menus, error: menuErr } = await supabase.from('menu_items').select('id, name').limit(5);
  if (menuErr) {
    console.error("Error menu_items:", menuErr);
  } else {
    console.log("Success menu_items! Count:", menus.length, "Sample:", menus);
  }

  const { data: ingredients, error: ingErr } = await supabase.from('ingredients').select('id, name, quantity').limit(5);
  if (ingErr) {
    console.error("Error ingredients:", ingErr);
  } else {
    console.log("Success ingredients! Count:", ingredients.length, "Sample:", ingredients);
  }
}

test();
