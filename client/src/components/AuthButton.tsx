import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { AuthError } from '@supabase/supabase-js';

export function AuthButton() {
  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (error) {
      const authError = error as AuthError;
      toast.error(authError.message || 'Failed to sign in with Google');
      console.error('Error:', authError);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center justify-center gap-2 w-full bg-white text-gray-800 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-5 h-5"
      />
      <span>Continue with Google</span>
    </button>
  );
}