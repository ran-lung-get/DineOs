import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function createCaptain() {
  console.log("Signing up captain user...");
  const { data, error } = await supabase.auth.signUp({
    email: 'zxcvbnm51107@gmail.com',
    password: '123456',
    options: {
      data: {
        full_name: 'Captain',
        display_name: 'Captain',
        role: 'captain',
      }
    }
  });

  if (error) {
    if (error.message.includes("already registered")) {
      console.log("User already registered. Logging in to update role...");
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'zxcvbnm51107@gmail.com',
        password: '123456'
      });
      if (loginError) {
        console.error("Login failed:", loginError);
        return;
      }
      console.log("Logged in. Updating role to captain...");
      // Try to update using anon if RLS allows, else it requires a manual DB update.
      // Assuming our users_update policy allows updating own role or it's inserted by trigger.
      const { error: updateError } = await supabase.from('users').update({ role: 'captain' }).eq('auth_user_id', loginData.user.id);
      if (updateError) {
        console.error("Failed to update role in users table:", updateError);
      } else {
        console.log("Successfully updated role to captain!");
      }
      return;
    }
    console.error("Signup failed:", error);
    return;
  }

  if (data.user) {
    console.log("Signup success! User ID:", data.user.id);
    console.log("Note: if Email Confirm is ON, the user is not automatically signed in.");
    console.log("Attempting to insert into users table manually...");
    const { error: insertError } = await supabase.from('users').upsert({
      auth_user_id: data.user.id,
      display_name: 'Captain',
      email: data.user.email,
      role: 'captain',
      is_active: true,
    }, { onConflict: 'auth_user_id', ignoreDuplicates: false });

    if (insertError) {
      console.error("Failed to insert into users table:", insertError);
    } else {
      console.log("Successfully created captain user in public.users!");
    }
  }
}

createCaptain();
