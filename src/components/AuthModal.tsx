import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { getSupabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    const supabase = getSupabase();
    if (supabase && isOpen) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          onClose();
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const supabase = getSupabase();
    if (!supabase) {
      setError('Database connection is missing. Please check your configuration.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccess('Check your email for the confirmation link!');
        // Optional: auto-switch to login or close
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    setSuccess('Opening Google login...');
    const supabase = getSupabase();
    if (!supabase) {
      setError('Database connection is missing. Please check your configuration.');
      setLoading(false);
      return;
    }

    try {
      console.log("Initiating Google Login with Supabase Popup...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true
        }
      });
      
      if (error) {
        console.error("Supabase OAuth Error:", error);
        throw error;
      }

      if (data?.url) {
        setSuccess('Please complete the login in the popup window.');
        const authWindow = window.open(data.url, 'supabase_oauth', 'width=600,height=700');
        
        if (!authWindow) {
          setError('Popup blocked. Please allow popups for this site.');
          setLoading(false);
          return;
        }

        // Poll for window closure or session
        const timer = setInterval(async () => {
          if (authWindow.closed) {
            clearInterval(timer);
            setLoading(true);
            setSuccess('Verifying login...');
            
            // Final check
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              onClose();
            } else {
              setSuccess('');
              setError('Login window closed. If you logged in, try clicking "Sign In" again or refresh the page.');
              setLoading(false);
            }
          }
        }, 1000);
      }
    } catch (err: any) {
      console.error("Google Login Catch Block:", err);
      setSuccess('');
      setError(err.message || 'An error occurred during Google authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[90] p-4"
          >
            <div className="glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-vibe-pink/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-vibe-cyan/20 rounded-full blur-3xl pointer-events-none" />

              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>

              <div className="text-center mb-8 relative z-10">
                <h2 className="text-3xl font-bold tracking-tighter mb-2">
                  {isLogin ? 'Welcome Back' : 'Join VibeIQ'}
                </h2>
                <p className="text-gray-400 text-sm">
                  {isLogin 
                    ? 'Enter your details to access your saved vibes.' 
                    : 'Create an account to save and sync your favorite spots.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {error && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                      {error}
                    </div>
                    <button 
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] text-slate-400 hover:bg-white/10 hover:text-white transition-all uppercase tracking-widest"
                    >
                      Refresh Page
                    </button>
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-vibe-pink transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-vibe-pink transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-vibe-pink to-vibe-purple text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="mt-6 relative z-10">
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-widest">Or continue with</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full mt-4 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>

              <div className="mt-6 text-center relative z-10 space-y-2">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors block w-full"
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
                
                <button
                  onClick={async () => {
                    const supabase = getSupabase();
                    if (supabase) {
                      setLoading(true);
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session) {
                        onClose();
                        window.location.reload(); // Force a full refresh to be safe
                      } else {
                        setError('No session found. Please log in first.');
                      }
                      setLoading(false);
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Logged in but still seeing this? Click to sync.
                </button>

                <div className="pt-4 mt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      const supabase = getSupabase();
                      const info = {
                        origin: window.location.origin,
                        supabaseConfigured: !!supabase,
                        hasKey: !!(import.meta as any).env.VITE_SUPABASE_ANON_KEY,
                        isIframe: window.self !== window.top
                      };
                      alert(JSON.stringify(info, null, 2));
                    }}
                    className="text-[10px] text-slate-600 hover:text-slate-400 uppercase tracking-widest"
                  >
                    Debug Connection Info
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
