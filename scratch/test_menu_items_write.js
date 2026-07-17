import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vshamisexmjcymsdyhym.supabase.co/';
const supabaseKey = 'sb_publishable_viPzmZUj0b2sbHlyWAnz5Q_PntK9O03';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing write/update to menu_items...");
  const tempId = 'm_test_temp_' + Date.now();
  
  // Try insert
  const { data: insertData, error: insertErr } = await supabase.from('menu_items').insert({
    id: tempId,
    name: 'เมนูทดสอบบีบ',
    price: 99.00,
    category: 'signature',
    is_available: true
  }).select();
  
  if (insertErr) {
    console.error("Insert failed:", insertErr);
  } else {
    console.log("Insert success!", insertData);
    
    // Try update
    const { data: updateData, error: updateErr } = await supabase.from('menu_items').update({
      price: 120.00
    }).eq('id', tempId).select();
    
    if (updateErr) {
      console.error("Update failed:", updateErr);
    } else {
      console.log("Update success!", updateData);
    }
    
    // Try delete
    const { error: deleteErr } = await supabase.from('menu_items').delete().eq('id', tempId);
    if (deleteErr) {
      console.error("Delete failed:", deleteErr);
    } else {
      console.log("Delete success!");
    }
  }
}

test();
