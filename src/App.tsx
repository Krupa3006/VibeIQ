import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Coffee, 
  Moon, 
  Wind, 
  Zap,
  Loader2,
  ArrowRight,
  History,
  Bookmark,
  User,
  X,
  Star,
  Share2,
  Grid,
  List,
  Filter,
  ChevronDown,
  LogOut,
  Users,
  CheckCircle2,
  Lock,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';
import { getGeminiResponse } from './services/gemini';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';

import { getSupabase } from './lib/supabase';
import { AuthModal } from './components/AuthModal';

interface VibeOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  prompt: string;
  count: string;
}

interface SavedVibe {
  id: string;
  title: string;
  url: string;
  vibeType: string;
  timestamp: number;
  score: number;
  category?: 'Work' | 'Relax' | 'Night';
  image?: string;
  description?: string;
}

interface VibeProfile {
  cozy: number;
  quiet: number;
  energetic: number;
  aesthetic: number;
  nature: number;
  social: number;
}

interface HistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

const VIBE_OPTIONS: VibeOption[] = [
  { 
    id: 'cozy', 
    label: 'Cozy Work', 
    icon: <span className="text-3xl">☕</span>, 
    color: 'from-pink-500/20 to-purple-500/20',
    prompt: "Find me cozy, quiet spots perfect for reading or intimate conversation. Think hidden cafes or quiet libraries.",
    count: "128 Places"
  },
  { 
    id: 'nature', 
    label: 'Nature Retreat', 
    icon: <span className="text-3xl">🌿</span>, 
    color: 'from-cyan-500/20 to-blue-500/20',
    prompt: "Find me peaceful outdoor spots or places filled with greenery. Think botanical gardens, rooftop parks, or waterfront walks.",
    count: "84 Places"
  },
  { 
    id: 'night', 
    label: 'Late Night', 
    icon: <span className="text-3xl">🌙</span>, 
    color: 'from-orange-500/20 to-red-500/20',
    prompt: "Find me late-night spots with a mysterious or sophisticated vibe. Think speakeasies, late-night diners, or neon-lit lounges.",
    count: "210 Places"
  },
  { 
    id: 'creative', 
    label: 'Creative Flow', 
    icon: <span className="text-3xl">✨</span>, 
    color: 'from-purple-500/20 to-indigo-500/20',
    prompt: "Find me inspiring spots for creative work or artistic inspiration. Think modern galleries, design-focused cafes, or unique architectural spaces.",
    count: "156 Places"
  },
  { 
    id: 'zen', 
    label: 'Zen Zones', 
    icon: <span className="text-3xl">🧘</span>, 
    color: 'from-green-500/20 to-emerald-500/20',
    prompt: "Find me peaceful, meditative spaces designed for deep relaxation and mindfulness.",
    count: "92 Places"
  },
  { 
    id: 'social', 
    label: 'Social Buzz', 
    icon: <span className="text-3xl">🍻</span>, 
    color: 'from-yellow-500/20 to-orange-500/20',
    prompt: "Find me lively, energetic spots perfect for meeting people or hanging out with friends.",
    count: "340 Places"
  },
  { 
    id: 'focus', 
    label: 'Deep Focus', 
    icon: <span className="text-3xl">🎧</span>, 
    color: 'from-blue-500/20 to-indigo-500/20',
    prompt: "Find me quiet, distraction-free environments for intense work or studying.",
    count: "115 Places"
  },
  { 
    id: 'romantic', 
    label: 'Romantic Date', 
    icon: <span className="text-3xl">🍷</span>, 
    color: 'from-red-500/20 to-pink-500/20',
    prompt: "Find me intimate, dimly lit spots perfect for a romantic date.",
    count: "89 Places"
  },
  { 
    id: 'aesthetic', 
    label: 'Aesthetic Cafe', 
    icon: <span className="text-3xl">📸</span>, 
    color: 'from-teal-500/20 to-emerald-500/20',
    prompt: "Find me visually stunning cafes with great interior design, perfect for photos.",
    count: "205 Places"
  },
  { 
    id: 'underground', 
    label: 'Underground', 
    icon: <span className="text-3xl">🕶️</span>, 
    color: 'from-gray-500/20 to-slate-500/20',
    prompt: "Find me hidden, underground, or alternative spots that are off the beaten path.",
    count: "64 Places"
  }
];

const TRENDING_CATEGORIES = [
  {
    id: 'cyberpunk',
    title: 'Cyberpunk Neon',
    description: 'High-tech environments with neon aesthetics and synthwave pulses.',
    icon: '🕶️',
    color: 'from-fuchsia-600/20 to-blue-600/20',
    popularity: '98%',
    prompt: 'Find me high-tech lounges with neon lighting and cyberpunk aesthetics.'
  },
  {
    id: 'dark-academia',
    title: 'Dark Academia',
    description: 'Moody libraries, hidden study nooks, and candle-lit intellectual sanctuaries.',
    icon: '📚',
    color: 'from-amber-900/20 to-stone-800/20',
    popularity: '94%',
    prompt: 'Find me moody libraries or quiet study spots with dark wood and vintage vibes.'
  },
  {
    id: 'biophilic',
    title: 'Biophilic Zen',
    description: 'Spaces where nature and architecture merge for ultimate cognitive restoration.',
    icon: '🌿',
    color: 'from-emerald-500/20 to-teal-500/20',
    popularity: '92%',
    prompt: 'Find me indoor spaces filled with plants and natural light for deep relaxation.'
  },
  {
    id: 'vaporwave',
    title: 'Vaporwave Dream',
    description: 'Pastel gradients, retro-future nostalgia, and surrealist spatial design.',
    icon: '🌊',
    color: 'from-pink-400/20 to-cyan-400/20',
    popularity: '89%',
    prompt: 'Find me visually unique spots with pastel colors and retro-future aesthetics.'
  },
  {
    id: 'minimalist',
    title: 'Obsidian Minimal',
    description: 'Sleek, monochromatic luxury designed for absolute sensory clarity.',
    icon: '🌑',
    color: 'from-gray-900/20 to-slate-800/20',
    popularity: '87%',
    prompt: 'Find me minimalist, monochromatic spaces with high-end design and quiet atmosphere.'
  },
  {
    id: 'solarpunk',
    title: 'Solarpunk Hubs',
    description: 'Sustainable, community-focused spaces with vibrant, optimistic energy.',
    icon: '☀️',
    color: 'from-yellow-400/20 to-orange-400/20',
    popularity: '85%',
    prompt: 'Find me bright, sustainable community spaces with high energy and positive vibes.'
  }
];

const FEATURED_PLACES = [
  {
    id: 'velvet-underground',
    title: 'The Velvet Underground',
    type: 'Boutique Cafe',
    match: '98',
    description: 'Deep focus meets melancholic jazz. The ultimate sanctuary for creators and thinkers.',
    image: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=best+jazz+cafe+near+me',
    rating: 4.9,
    reviews: 342,
    distance: '0.8 miles',
    price: '$$',
    snippet: 'The perfect spot to get lost in your work. The jazz playlist is impeccable and the pour-over coffee is top tier.'
  },
  {
    id: 'neon-pulse',
    title: 'Neon Pulse Labs',
    type: 'High-Tech Lounge',
    match: '94',
    description: 'High-tech performance environments. Where cyberpunk aesthetics meet craft cocktails.',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=neon+lounge+bar+near+me',
    rating: 4.7,
    reviews: 891,
    distance: '2.1 miles',
    price: '$$$',
    snippet: 'Incredible atmosphere. The neon lighting and synthwave music make you feel like you are in the future.'
  },
  {
    id: 'eclipse-lounge',
    title: 'Eclipse Lounge',
    type: 'Minimalist Bar',
    match: '91',
    description: 'Minimalist luxury and fine spirits. A quiet escape from the city noise.',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=minimalist+cocktail+bar+near+me',
    rating: 4.8,
    reviews: 215,
    distance: '1.5 miles',
    price: '$$$$',
    snippet: 'The definition of understated elegance. Perfect for a late-night drink when you want to actually hear the person you are talking to.'
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour Sanctuary',
    type: 'Morning Ritual',
    match: '96',
    description: 'Sunlit cafe with plants and jazz. The perfect start to your day.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=aesthetic+sunlit+cafe+near+me',
    rating: 4.9,
    reviews: 512,
    distance: '0.5 miles',
    price: '$$',
    snippet: 'The morning light here is magical. Best matcha latte in the city.'
  },
  {
    id: 'electric-pulse',
    title: 'Electric Pulse',
    type: 'Night Life',
    match: '93',
    description: 'Neon lounge with high energy. Where the city comes alive.',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=high+energy+nightclub+near+me',
    rating: 4.6,
    reviews: 843,
    distance: '3.2 miles',
    price: '$$$',
    snippet: 'Great DJs and an incredible sound system. The vibe is unmatched.'
  },
  {
    id: 'ethereal-woodlands',
    title: 'Ethereal Woodlands',
    type: 'Serene Escape',
    match: '97',
    description: 'Peaceful nature escape. Reconnect with the earth.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
    url: 'https://maps.google.com/?q=peaceful+nature+park+near+me',
    rating: 4.9,
    reviews: 128,
    distance: '12.4 miles',
    price: 'Free',
    snippet: 'A hidden gem just outside the city. The perfect place to clear your head.'
  }
];

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  text: string;
  auraLevel: string;
  color: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: '1',
    author: 'Julian V.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCbMJ1XowNrQZebcd7tmkmLpc92NGoCVBQW4cjrQwfxE5YdVqVGc3MuxxEwP4oIr16jSkdSLdKvaW7wsoGKrOXmwz5UU7SyEyT0Hlcu0wLK9jK1QjWX4p2wd0kX9Rmm5DKMc3ICCcCPl5-ZJdwEzf4JEvvrGTtJJRFN_wL6tKVStiH2PHhc1_MEQFLYd2-CxEEPd5QLyIjUAdEagZaH7dZlx3jAy13TosJXtB5iMdTlqtJ_KxKXrPgsFOZhyyAzbbsA-0rBMGlt5Y',
    rating: 5,
    text: "The reverb in the main hall is curated for binaural beats. Spent 4 hours here and it felt like 20 minutes.",
    auraLevel: '8.4',
    color: '#00f2fe'
  },
  {
    id: '2',
    author: 'Elena R.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBN4nVouPjJjm7_I1tJruMJegMB9enBoXm6gnXQ7Bsb7uwee0bqZDx2AEEQhaOz16YtFXD-gHI8MzLeZDf8yrKSwKQyYYeBflL0xo8l99IQSClnFtwv5_19AHbiYa3BxpZiFAavx5EmN12Zs8xLhWW0ULXsOcpcTGVck6TuLH32kXtjNnoWVLzLWVMUvMMu-jlPKwC4r6Uoyakisjvnzv0ZLxT3JliAWYDSIYxZ05FB_A1-3kkiT797H6bqy49SBF3AYCrjvxZMGmc',
    rating: 4,
    text: "Found my second home. The Obsidian Lounge understands the assignment when it comes to low-frequency hum.",
    auraLevel: '9.1',
    color: '#ff0080'
  },
  {
    id: '3',
    author: 'Marcus T.',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA8j0NP3Ih5NYklG6MMQp68bB60XzRkQFkjawItj568rog2RoBzQFKwArzEnvHkONQulRX5hYtRP7lCzJVM31zHcBJwZNEiJOFSWOawFY2a0ngQ5DWS-T2ZBjEMXA_hftxK5geTxWVVciX3fo_h72sD8SbpPX3uU6_Pw_3O_3M7lygdcBE2CFREgVRhYwZIo9tC53-748HtfdA6jaA8tRpHejgId-ncz78a7sLuFtZvQ6omI8GeRS3k1yMP4ZEMSgGJoedqujEQtfI',
    rating: 4,
    text: "A bit too sterile for my usual taste, but the 'Focus' vibe score was surprisingly accurate. Finished my sprint early.",
    auraLevel: '7.9',
    color: '#7928ca'
  }
];

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [vaultView, setVaultView] = useState<'grid' | 'list'>('grid');
  const [vaultSort, setVaultSort] = useState<'recent' | 'match'>('recent');
  const [selectedVibe, setSelectedVibe] = useState<VibeOption | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{ text: string; links: any[], query: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Product Features State
  const [savedVibes, setSavedVibes] = useState<SavedVibe[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAllMoods, setShowAllMoods] = useState(false);
  const [showTrending, setShowTrending] = useState(false);
  const [trendingMoods, setTrendingMoods] = useState<any[]>(TRENDING_CATEGORIES);
  const [isTrendingLoading, setIsTrendingLoading] = useState(false);

  // We'll keep the fetch function but maybe call it less often or only on request
  // For now, let's make it instant by using the curated list
  const fetchTrendingMoods = async () => {
    // If we already have curated ones, we can skip the slow AI call or do it in background
    // For now, let's just use the curated ones to keep it fast as requested
    setTrendingMoods(TRENDING_CATEGORIES);
  };
  const [showMap, setShowMap] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showVibeProfile, setShowVibeProfile] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'info' } | null>(null);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [isPro, setIsPro] = useState(true);
  const [vibePoints, setVibePoints] = useState(1250);
  const [searchCount, setSearchCount] = useState(0);
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [vibeProfile, setVibeProfile] = useState<VibeProfile>({
    cozy: 75,
    quiet: 60,
    energetic: 40,
    aesthetic: 85,
    nature: 50,
    social: 30
  });
  const [vaultCategory, setVaultCategory] = useState<'All' | 'Work' | 'Relax' | 'Night'>('All');
  
  // Advanced Filters State
  const [activeFilters, setActiveFilters] = useState({
    noise: '',
    lighting: '',
    crowd: '',
    intensity: ''
  });
  
  // Auth State
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [initTimeout, setInitTimeout] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const showNotification = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Handle OAuth popup callback
    const isAuthCallback = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('error=') ||
                          window.location.search.includes('code=') ||
                          window.location.search.includes('error=');

    if (window.opener && isAuthCallback) {
      console.log("Detected OAuth callback in popup, processing session...");
      const supabase = getSupabase();
      if (supabase) {
        // Wait for Supabase to process the URL and set the session
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            console.log("Session established in popup, notifying opener with session data...");
            window.opener.postMessage({ 
              type: 'OAUTH_AUTH_SUCCESS', 
              session: session 
            }, '*');
            setTimeout(() => window.close(), 1000);
          } else {
            console.log("No session yet, polling...");
            let attempts = 0;
            const interval = setInterval(async () => {
              attempts++;
              const { data: { session: s } } = await supabase.auth.getSession();
              if (s || attempts > 10) {
                clearInterval(interval);
                if (s) {
                  window.opener.postMessage({ 
                    type: 'OAUTH_AUTH_SUCCESS', 
                    session: s 
                  }, '*');
                  setTimeout(() => window.close(), 500);
                }
              }
            }, 500);
          }
        });
      } else {
        window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
        setTimeout(() => window.close(), 1000);
      }
      return;
    }

    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        console.log("OAuth Success message received, refreshing session...");
        const supabase = getSupabase();
        if (supabase) {
          // If session data was passed, set it directly
          if (event.data.session) {
            console.log("Setting session from message data...");
            const { access_token, refresh_token } = event.data.session;
            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token
              });
            }
          }

          // Poll for session for a few seconds as backup
          let attempts = 0;
          const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) console.error("Session check error:", error);
            
            if (session?.user) {
              console.log("Session found after OAuth message:", session.user.email);
              setUser(session.user);
              if (session.user.user_metadata?.full_name) {
                setUserName(session.user.user_metadata.full_name);
              }
              setIsPro(true);
              setShowLoginSuccess(true);
              setShowPointsInfo(true);
              setShowAuthModal(false);
              setTimeout(() => setShowLoginSuccess(false), 3000);
              return true;
            }
            return false;
          };

          const interval = setInterval(async () => {
            attempts++;
            console.log(`Polling session... attempt ${attempts}`);
            const found = await checkSession();
            if (found || attempts > 15) {
              clearInterval(interval);
              if (!found) console.warn("Polling timed out without finding session.");
            }
          }, 1000);
          
          await checkSession();
        } else {
          console.error("Supabase client not available for session check.");
        }
      }
    };
    window.addEventListener('message', handleOAuthMessage);

    // Supabase Auth Listener
    const supabase = getSupabase();
    let subscription: any = null;

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        if (currentUser) console.log("Initial session found:", currentUser.email);
        setUser(currentUser);
        if (currentUser?.user_metadata?.full_name) {
          setUserName(currentUser.user_metadata.full_name);
        }
        setIsPro(true);
      });

      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state change event:", event);
        const currentUser = session?.user ?? null;
        setUser(prevUser => {
          if (!prevUser && currentUser) {
            console.log("User logged in via state change:", currentUser.email);
            setShowLoginSuccess(true);
            setShowPointsInfo(true);
            setShowAuthModal(false);
            setTimeout(() => setShowLoginSuccess(false), 3000);
          }
          return currentUser;
        });
        
        if (currentUser?.user_metadata?.full_name) {
          setUserName(currentUser.user_metadata.full_name);
        }
        setIsPro(true);
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
      window.removeEventListener('message', handleOAuthMessage);
    };
  }, []);

  useEffect(() => {
    // Load data from Supabase (or fallback to Local Storage)
    const loadData = async () => {
      // Set a timeout for initialization to prevent infinite hang
      const timeoutId = setTimeout(() => {
        setInitTimeout(true);
        setIsInitializing(false);
      }, 8000);

      try {
        // Restore search state if coming back from Stripe
        const savedQuery = sessionStorage.getItem('vibe_search_query');
        const savedResults = sessionStorage.getItem('vibe_search_results');
        if (savedQuery) {
          setSearchQuery(savedQuery);
          sessionStorage.removeItem('vibe_search_query');
        }
        if (savedResults) {
          try {
            const parsed = JSON.parse(savedResults);
            if (parsed && typeof parsed === 'object') {
              setResults(parsed);
              sessionStorage.removeItem('vibe_search_results');
            }
          } catch (e) {
            console.error("Error restoring search results", e);
          }
        }

        const supabase = getSupabase();
        
        if (supabase) {
          try {
            const { data: saved } = await supabase.from('saved_vibes').select('*');
            const { data: hist } = await supabase.from('history').select('*');
            
            if (saved) setSavedVibes(saved);
            if (hist) setHistory(hist);
          } catch (err) {
            console.error("Supabase load error:", err);
          }
        }

        // Fallback to Local Storage if Supabase fails or is missing
        const storedSaved = localStorage.getItem('vibecheck_saved');
        const storedHistory = localStorage.getItem('vibecheck_history');
        if (storedSaved && savedVibes.length === 0) {
          try {
            setSavedVibes(JSON.parse(storedSaved));
          } catch(e) {}
        }
        if (storedHistory && history.length === 0) {
          try {
            setHistory(JSON.parse(storedHistory));
          } catch(e) {}
        }
      } finally {
        clearTimeout(timeoutId);
        setIsInitializing(false);
      }
    };

    loadData();

    // Get Location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.error("Location access denied", err);
          setLocation({ lat: 40.7128, lng: -74.0060 }); // NYC
        }
      );
    }
  }, []);

  // Scroll to top on view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [
    selectedPlace, 
    results, 
    showVault, 
    showTrending, 
    showMap, 
    showProfile, 
    showVibeProfile, 
    showAllMoods,
    showHistory,
    isLoading
  ]);

  const saveToHistory = async (query: string) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      query,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem('vibecheck_history', JSON.stringify(updatedHistory));
    
    // Sync to Supabase
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('history').insert([newItem]);
    }
  };

  const handleShare = async (title: string, text: string, url: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VibeIQ | ${title}`,
          text: text,
          url: url || window.location.href,
        });
        showNotification('Shared successfully!', 'success');
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${title}: ${url || window.location.href}`);
        showNotification('Link copied to clipboard!', 'success');
      } catch (err) {
        showNotification('Failed to copy link', 'info');
      }
    }
  };

  const toggleSaveVibe = async (link: any, category: 'Work' | 'Relax' | 'Night' = 'Relax') => {
    const isSaved = savedVibes.find(v => v.url === link.url);
    
    const supabase = getSupabase();
    let updated;
    if (isSaved) {
      updated = savedVibes.filter(v => v.url !== link.url);
      if (supabase) {
        await supabase.from('saved_vibes').delete().eq('url', link.url);
      }
      showNotification('Removed from Vault', 'info');
    } else {
      const newVibe: SavedVibe = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title: link.title,
        url: link.url,
        vibeType: selectedVibe?.label || 'Custom',
        timestamp: Date.now(),
        score: Math.floor(Math.random() * 20) + 80, // Mock Vibe Score
        category,
        description: link.description || link.snippet
      };
      updated = [newVibe, ...savedVibes];
      if (supabase) {
        await supabase.from('saved_vibes').insert([newVibe]);
      }
      showNotification(`Saved to ${category} Vault`, 'success');
      
      // Ask for review after saving
      setTimeout(() => {
        setShowReviewPrompt(true);
      }, 1000);
    }
    setSavedVibes(updated);
    localStorage.setItem('vibecheck_saved', JSON.stringify(updated));
  };

  const handleLike = (id: string) => {
    if (likes.includes(id)) {
      setLikes(likes.filter(l => l !== id));
    } else {
      setLikes([...likes, id]);
      setDislikes(dislikes.filter(d => d !== id));
      // Update vibe profile slightly
      setVibeProfile(prev => ({
        ...prev,
        aesthetic: Math.min(100, prev.aesthetic + 2),
        cozy: Math.min(100, prev.cozy + 1)
      }));
    }
  };

  const handleDislike = (id: string) => {
    if (dislikes.includes(id)) {
      setDislikes(dislikes.filter(d => d !== id));
    } else {
      setDislikes([...dislikes, id]);
      setLikes(likes.filter(l => l !== id));
    }
  };

  const handleSearch = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const finalPrompt = customPrompt || searchQuery;
    if (!finalPrompt && !selectedVibe) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    saveToHistory(finalPrompt || selectedVibe?.label || 'Custom Search');

    try {
      const modelName = "gemini-3-flash-preview";
      
      const systemInstruction = `
        You are VibeIQ, a high-end personal aesthetic assistant. 
        Your goal is to find real, existing places that perfectly match the user's emotional and sensory needs, prioritizing proximity above all else.
        
        CRITICAL LOCATION RULES:
        1. You MUST prioritize results within a 10-mile radius of the user's current coordinates.
        2. If you find exceptional matches that are further away (out of the city), you MUST list them at the very end under a clear heading: "--- WORTH THE TRIP (OUT OF CITY) ---".
        3. Never suggest a far-away place as a primary result if a local equivalent exists.
        
        CRITICAL: You MUST find specific businesses or locations that can be found on Google Maps. 
        
        For each place you find, provide:
        1. A "Vibe Analysis": A deeply descriptive, human-like explanation of the atmosphere. 
           Mention specific details like lighting (dim, warm, natural), noise level (hushed whispers, energetic buzz), 
           crowd type (creative nomads, sophisticated locals), and the general emotional resonance.
        2. A "Vibe Score": A percentage (0-100) of how well it matches the user's specific request.
        3. "Hidden Gems": Prioritize unique, off-the-beaten-path locations.
        
        Format your response in a clear, sophisticated way. 
        Start with a brief, poetic summary of the overall vibe of the results.
        Then, for each place, use this structure:
        ### [Place Name]
        **Vibe Match: [Score]%**
        **The Atmosphere:** [Emotional and sensory explanation]
        **Why it matches:** [Specific connection to user's prompt and any active filters]
      `;

      const filterContext = `
        Active Sensory Filters:
        - Noise Level: ${activeFilters.noise || 'Any'}
        - Lighting: ${activeFilters.lighting || 'Any'}
        - Crowd: ${activeFilters.crowd || 'Any'}
        - Intensity: ${activeFilters.intensity || 'Any'}
      `;

      const locationContext = location 
        ? `User is currently at Coordinates: ${location.lat}, ${location.lng}. ONLY suggest places near this location first.`
        : "User location is unknown. Suggest general high-vibe spots.";

      const userPrompt = `
        [STRICT PROXIMITY REQUEST]
        ${locationContext}
        User Mood/Request: "${finalPrompt}"
        ${selectedVibe ? `Selected Category: ${selectedVibe.label}` : ""}
        ${filterContext}
        
        Please find 12-15 real places that match this vibe. 
        - FIRST: List places within 5-10 miles of the user.
        - LAST: If needed, suggest 2-3 "Worth the Trip" spots that are further away, clearly labeled.
      `;

      const responsePromise = getGeminiResponse(userPrompt, location || undefined, modelName, systemInstruction);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("The aesthetic engine is taking longer than usual. This can happen with complex searches. Please try again.")), 60000)
      );
      const response = await Promise.race([responsePromise, timeoutPromise]) as any;
      
      setSearchCount(prev => prev + 1);
      
      const links = (response.groundingChunks || [])
        .filter((chunk: any) => chunk.maps?.uri || chunk.web?.uri)
        .map((chunk: any) => ({
          title: chunk.maps?.title || chunk.web?.title || "View on Maps",
          url: chunk.maps?.uri || chunk.web?.uri
        }));

      setResults({
        text: response.text,
        links,
        query: finalPrompt || selectedVibe?.label || 'Custom Search'
      });
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSupabaseConfigured = () => {
    const supabase = getSupabase();
    return !!supabase;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white selection:bg-vibe-pink/30 font-body">
      {/* Supabase Key Warning */}
      {!isSupabaseConfigured() && (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-[10px] py-1 text-center z-[9999] font-bold uppercase tracking-widest">
          Database Configuration Missing - Login Features Disabled
        </div>
      )}
      <div className="noise-overlay"></div>
      
      {/* Ambient Background Elements */}
      <div className="glow-orb top-[-20%] left-[-10%] bg-[#ff0080]"></div>
      <div className="glow-orb top-[20%] right-[10%] bg-[#7928ca] opacity-[0.08]"></div>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-6 md:px-8 py-4 md:py-5 shadow-[0_0_20px_rgba(121,40,202,0.1)]">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold vibe-gradient-text font-headline tracking-tighter cursor-pointer" onClick={() => { setResults(null); setSelectedPlace(null); setSearchQuery(''); setShowAllMoods(false); setShowTrending(false); setShowMap(false); setShowVault(false); setShowProfile(false); setShowVibeProfile(false); }}>VibeIQ</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <button onClick={() => { setResults(null); setSelectedPlace(null); setSearchQuery(''); setShowAllMoods(false); setShowTrending(false); setShowMap(false); setShowVault(false); setShowProfile(false); setShowVibeProfile(false); }} className={cn("font-medium font-headline tracking-tight transition-colors pb-1", !results && !selectedPlace && !showAllMoods && !showTrending && !showMap && !showVault && !showProfile && !showVibeProfile ? "text-white border-b-2 border-vibe-pink" : "text-slate-400 hover:text-white")}>Explore</button>
            <button onClick={() => { if(!user){setShowAuthModal(true); return;} setResults(null); setSelectedPlace(null); setShowAllMoods(false); setShowMap(false); setShowVault(false); setShowProfile(false); setShowVibeProfile(false); setShowTrending(true); }} className={cn("font-medium font-headline tracking-tight transition-colors pb-1", showTrending ? "text-white border-b-2 border-vibe-pink" : "text-slate-400 hover:text-white")}>Trending</button>
            <button onClick={() => { setResults(null); setSelectedPlace(null); setShowAllMoods(false); setShowTrending(false); setShowVault(false); setShowProfile(false); setShowVibeProfile(false); setShowMap(true); }} className={cn("font-medium font-headline tracking-tight transition-colors pb-1", showMap ? "text-white border-b-2 border-vibe-pink" : "text-slate-400 hover:text-white")}>Vibe Map</button>
            <div className="relative group">
              <button onClick={() => { if(!user){setShowAuthModal(true); return;} setResults(null); setSelectedPlace(null); setShowAllMoods(false); setShowTrending(false); setShowMap(false); setShowProfile(false); setShowVibeProfile(false); setShowVault(true); }} className={cn("font-medium font-headline tracking-tight transition-colors pb-1", showVault ? "text-white border-b-2 border-vibe-pink" : "text-slate-400 hover:text-white")}>Vault</button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 p-3 bg-[#1a1a24]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                <p className="text-xs text-slate-300 text-center leading-relaxed">Your personal collection of bookmarked places. Save spots that match your vibe to visit later.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {user && (
            <button 
              onClick={() => setShowRewardsModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#00f2fe]" />
              <span className="text-xs font-bold text-white">{vibePoints.toLocaleString()}</span>
            </button>
          )}
          <button onClick={() => user ? setShowHistory(true) : setShowAuthModal(true)} className="text-slate-400 hover:text-white transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,0,128,0.4)] p-2 rounded-full active:scale-95">
            <History className="w-6 h-6" />
          </button>
          <div className="relative group">
            <button onClick={() => { if(!user){setShowAuthModal(true); return;} setResults(null); setSelectedPlace(null); setShowAllMoods(false); setShowTrending(false); setShowMap(false); setShowProfile(false); setShowVibeProfile(false); setShowVault(true); }} className="text-slate-400 hover:text-white transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(255,0,128,0.4)] p-2 rounded-full active:scale-95 relative">
              <Bookmark className="w-6 h-6" />
              {savedVibes.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-vibe-pink rounded-full" />
              )}
            </button>
            <div className="absolute top-full right-0 mt-2 w-56 p-3 bg-[#1a1a24]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
              <p className="text-xs text-slate-300 text-center leading-relaxed">Your personal collection of bookmarked places. Save spots that match your vibe to visit later.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              if(!user){setShowAuthModal(true); return;}
              setResults(null); setSelectedPlace(null); setShowAllMoods(false); setShowTrending(false); setShowMap(false); setShowVault(false); setShowVibeProfile(false); setShowProfile(true);
            }}
            className="w-10 h-10 rounded-full p-[1px] vibe-gradient-bg active:scale-95 transition-transform group"
          >
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center relative">
              {user ? (
                <>
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || user.email}&backgroundColor=ff0080,7928ca,00f2fe`} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                  {isPro && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-vibe-pink rounded-full border-2 border-black flex items-center justify-center">
                      <Star className="w-2 h-2 text-white fill-white" />
                    </div>
                  )}
                </>
              ) : (
                <User className="w-5 h-5 text-gray-400 group-hover:text-white" />
              )}
            </div>
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full relative pt-32 md:pt-40 pb-24 px-6 max-w-7xl mx-auto flex flex-col items-center min-h-[70vh]">
        
        {/* Initializing State */}
        <AnimatePresence>
          {isInitializing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#0a0a0f] z-[100] flex flex-col items-center justify-center"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-vibe-pink/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-vibe-pink border-t-transparent rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-vibe-pink animate-pulse" />
              </div>
              <h2 className="text-2xl font-headline font-bold vibe-gradient-text mb-2">VibeIQ</h2>
              <p className="text-slate-500 text-sm animate-pulse">Initializing aesthetic engine...</p>
              
              {initTimeout && (
                <button 
                  onClick={() => setIsInitializing(false)}
                  className="mt-8 px-6 py-2 rounded-full border border-white/10 text-slate-400 text-xs hover:bg-white/5"
                >
                  Taking too long? Click to skip
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex-1 flex flex-col items-center justify-center py-20 relative z-40"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-vibe-pink/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-vibe-pink border-t-transparent rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-vibe-pink animate-pulse" />
              </div>
              <p className="text-xl font-medium text-gray-400 animate-pulse font-headline">
                Mapping neuro-aesthetic frequencies...
              </p>
              <button 
                onClick={() => setIsLoading(false)}
                className="mt-12 px-6 py-2 rounded-full border border-white/10 text-slate-500 text-xs hover:bg-white/5 transition-colors"
              >
                Cancel Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        {error && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl mb-12 p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 text-center font-medium flex flex-col items-center gap-4"
          >
            <p>{error}</p>
            <button 
              onClick={() => handleSearch()}
              className="px-6 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-all text-sm font-bold uppercase tracking-widest"
            >
              Retry Search
            </button>
          </motion.div>
        )}

        {/* Vault View */}
        {showVault && !isLoading && !selectedPlace && !results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-screen-2xl mx-auto"
          >
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-5xl font-bold font-headline tracking-tighter">Your Vault</h1>
                  {isPro && (
                    <span className="px-3 py-1 rounded-md bg-vibe-pink/10 border border-vibe-pink/30 text-vibe-pink text-[10px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,128,0.2)]">Pro</span>
                  )}
                  <div className="group relative flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-slate-400 hover:text-[#00f2fe] hover:border-[#00f2fe] cursor-help transition-colors">
                      <span className="text-xs font-bold">i</span>
                    </div>
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 w-64 p-4 bg-[#1a1a24]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-white block mb-1 text-sm">What is the Vault?</strong>
                        Your personal collection of bookmarked places. Save spots that match your vibe to easily find and visit them later. Curating your Vault also earns you Vibe Points!
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-400 font-body">Places that matched your energy.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setVaultView('grid')}
                    className={cn("p-2 px-3 rounded-lg transition-all duration-200", vaultView === 'grid' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setVaultView('list')}
                    className={cn("p-2 px-3 rounded-lg transition-all duration-200", vaultView === 'list' ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button 
                  onClick={() => setVaultSort(vaultSort === 'recent' ? 'match' : 'recent')}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
                >
                  Sort: {vaultSort === 'recent' ? 'Recent' : 'Match %'}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </header>

            {/* Category Tabs */}
            <div className="flex items-center gap-6 mb-12 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
              {(['All', 'Work', 'Relax', 'Night'] as const).map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setVaultCategory(cat)}
                  className={cn(
                    "relative py-4 px-2 font-headline font-bold transition-all duration-300 whitespace-nowrap",
                    vaultCategory === cat ? "text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {cat === 'All' ? 'All Vibes' : cat === 'Work' ? '☕ Work Mode' : cat === 'Relax' ? '🌿 Relax' : '🌙 Night Vibes'}
                  {vaultCategory === cat && (
                    <motion.div 
                      layoutId="vault-tab"
                      className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-vibe-pink to-vibe-purple rounded-full shadow-[0_0_15px_rgba(255,0,128,0.5)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Saved Cards Grid */}
            <div className={cn(
              "grid gap-8",
              vaultView === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {savedVibes.filter(v => vaultCategory === 'All' || v.category === vaultCategory).length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center text-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-8 border border-white/10"
                  >
                    <Bookmark className="w-10 h-10 text-slate-600" />
                  </motion.div>
                  <h3 className="text-3xl font-bold text-white mb-4 font-headline">Your {vaultCategory === 'All' ? '' : vaultCategory} Vault is Empty</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-10 leading-relaxed">
                    {vaultCategory === 'All' 
                      ? "You haven't saved any vibes yet. Explore the city and bookmark the places that speak to your soul."
                      : `You haven't saved any places for ${vaultCategory.toLowerCase()} yet. Start curating your perfect ${vaultCategory.toLowerCase()} environment.`}
                  </p>
                  <button 
                    onClick={() => { setShowVault(false); setResults(null); }}
                    className="vibe-gradient-bg text-white font-bold px-10 py-4 rounded-full hover:shadow-[0_0_30px_rgba(255,0,128,0.4)] transition-all flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Start Exploring
                  </button>
                </div>
              ) : (
                savedVibes
                  .filter(v => vaultCategory === 'All' || v.category === vaultCategory)
                  .map((vibe, i) => (
                  <div key={vibe.id} className={cn(
                    "glass-panel rounded-xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:shadow-[0_0_30px_rgba(121,40,202,0.15)] hover:border-[#7928ca]/30 flex",
                    vaultView === 'grid' ? "flex-col" : "flex-row items-center h-48"
                  )}>
                    <div className={cn(
                      "relative shrink-0",
                      vaultView === 'grid' ? "h-64 w-full" : "h-full w-64"
                    )}>
                      <img 
                        alt={vibe.title} 
                        className="w-full h-full object-cover" 
                        src={`https://loremflickr.com/800/600/${vibe.vibeType === 'nature' ? 'park' : vibe.vibeType === 'night' ? 'bar,neon' : 'cafe,interior'}?lock=${i + vibe.title.length}`}
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 bg-[#0a0a0f]/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest text-[#00e2ed] border border-[#00e2ed]/30 shadow-[0_0_15px_rgba(0,226,237,0.3)]">
                          {vibe.score || 92}% Match
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSaveVibe(vibe);
                        }}
                        className="absolute top-4 right-4 p-2 bg-[#0a0a0f]/60 backdrop-blur-md rounded-full text-[#ff0080] hover:text-[#ff0080]/80 transition-colors"
                      >
                        <Bookmark className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                    <div className={cn("p-6 flex-1 flex flex-col", vaultView === 'list' && "justify-center h-full")}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold font-headline">{vibe.title}</h3>
                        <div className="flex items-center gap-1 text-[#bd82ff] text-sm">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold">4.8</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        0.4 miles away
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[11px] text-slate-300">Quiet</span>
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[11px] text-slate-300">Cozy</span>
                        <span className="px-2 py-1 bg-white/5 rounded-lg text-[11px] text-slate-300">Dim Lighting</span>
                      </div>
                      <p className="text-sm italic text-[#96f8ff]/70 mb-6 border-l-2 border-[#96f8ff]/20 pl-4 flex-1">
                        "Perfect for slow mornings and deep focus."
                      </p>
                      <button 
                        onClick={() => setSelectedPlace(vibe)}
                        className={cn(
                          "py-3 bg-gradient-to-r from-[#ff0080] via-[#7928ca] to-[#00f2fe] rounded-xl font-bold text-sm tracking-wide shadow-lg active:scale-95 transition-all duration-200 mt-auto",
                          vaultView === 'grid' ? "w-full" : "w-48"
                        )}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Profile View */}
        {showProfile && user && !isLoading && !selectedPlace && !results && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-3xl mx-auto"
          >
            <div className="glass-panel rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-[#ff0080]/20 via-[#7928ca]/20 to-[#00f2fe]/20 blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || user.email}&backgroundColor=ff0080,7928ca,00f2fe`} 
                    alt="Avatar" 
                    className="w-32 h-32 rounded-full shadow-[0_0_40px_rgba(121,40,202,0.4)] border-4 border-[#0a0a0f] object-cover bg-[#1a1a24]"
                  />
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-4 border-transparent">
                    <span className="text-white text-xs font-bold uppercase tracking-widest">Edit Profile</span>
                  </div>
                </div>
                
                {isEditingName ? (
                  <div className="flex flex-col items-center gap-3 mb-8 w-full max-w-xs">
                    <input 
                      type="text" 
                      value={userName} 
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white text-center focus:outline-none focus:border-[#ff0080] transition-colors"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingName(false);
                          // In a real app, save to Supabase here
                        }
                      }}
                    />
                    <button 
                      onClick={() => setIsEditingName(false)}
                      className="text-xs text-[#00f2fe] hover:text-white transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="mb-8 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                    <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2 text-white flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        {userName || user.email?.split('@')[0] || 'Vibe Explorer'}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 text-sm">✎</span>
                      </div>
                    </h1>
                    <p className="text-slate-400">{user.email}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => {setShowProfile(false); setShowVault(true);}}>
                    <div className="text-3xl font-bold text-[#00f2fe] mb-1 group-hover:scale-110 transition-transform">{savedVibes.length}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Saved Vibes</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => setShowVibeProfile(true)}>
                    <div className="text-3xl font-bold text-vibe-pink mb-1 group-hover:scale-110 transition-transform">{vibeProfile.aesthetic}%</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Aesthetic Alignment</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer group col-span-2 md:col-span-1" onClick={() => setShowPointsInfo(true)}>
                    <div className="text-3xl font-bold text-vibe-cyan mb-1 group-hover:scale-110 transition-transform">{vibePoints.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Vibe Points</div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-md mb-10">
                  <button 
                    onClick={() => setShowVibeProfile(true)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-vibe-cyan/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-vibe-cyan/10 flex items-center justify-center text-vibe-cyan group-hover:scale-110 transition-transform">
                        <Zap className="w-5 h-5 fill-current" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">Your Vibe Profile</div>
                        <div className="text-xs text-slate-500">Analyze your aesthetic DNA</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-vibe-cyan transition-colors" />
                  </button>

                  <button 
                    onClick={async () => {
                      const supabase = getSupabase();
                      if (supabase) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user) {
                          setUser(session.user);
                          if (session.user.user_metadata?.full_name) {
                            setUserName(session.user.user_metadata.full_name);
                          }
                          setIsPro(true);
                          showNotification("Session synced successfully!", "success");
                        } else {
                          showNotification("No active session found. Please try logging in again.", "info");
                        }
                      }
                    }}
                    className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-vibe-pink/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-vibe-pink/10 flex items-center justify-center text-vibe-pink group-hover:scale-110 transition-transform">
                        <Loader2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">Account Sync</div>
                        <div className="text-xs text-slate-500">Refresh your login status</div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-vibe-pink transition-colors" />
                  </button>
                </div>

                {/* Referral Section */}
                <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 mb-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-vibe-pink/10 blur-3xl rounded-full group-hover:bg-vibe-pink/20 transition-all"></div>
                  <h3 className="text-lg font-bold text-white mb-2 font-headline flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 text-vibe-pink" />
                    Refer a Friend
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">Give your friends 1 month of Pro and earn 500 Vibe Points for every referral.</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 font-mono flex items-center overflow-hidden">
                      vibeiq.app/ref/{user.id.substring(0, 8)}
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://vibeiq.app/ref/${user.id.substring(0, 8)}`);
                        showNotification('Referral link copied to clipboard!', 'success');
                      }}
                      className="px-6 py-3 bg-white text-black font-bold rounded-xl text-xs hover:bg-gray-100 transition-colors active:scale-95"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    getSupabase()?.auth.signOut();
                    setShowProfile(false);
                  }}
                  className="px-8 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-slate-300 font-bold flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 20, x: '-50%' }}
              className="fixed bottom-10 left-1/2 z-[200] px-6 py-3 rounded-2xl bg-[#1a1a24] border border-white/10 shadow-2xl flex items-center gap-3 min-w-[300px]"
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                toast.type === 'success' ? "bg-green-500/20 text-green-500" : "bg-vibe-cyan/20 text-vibe-cyan"
              )}>
                {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <span className="text-white text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vibe Analysis Modal */}
        <AnimatePresence>
          {showAnalysisModal && results && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAnalysisModal(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-2xl bg-[#0e0e13] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-vibe-pink"></div>
                <div className="p-8 md:p-10">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-bold text-white font-headline flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-vibe-pink" />
                      AI Vibe Analysis
                    </h3>
                    <button 
                      onClick={() => setShowAnalysisModal(false)}
                      className="p-2 rounded-full hover:bg-white/5 transition-colors"
                    >
                      <X className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <Markdown>{results.text}</Markdown>
                  </div>
                  
                  <button 
                    onClick={() => setShowAnalysisModal(false)}
                    className="w-full mt-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                  >
                    Got it, let's explore
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Vibe Profile View Modal */}
        <AnimatePresence>
          {showVibeProfile && user && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowVibeProfile(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 40 }}
                className="relative w-full max-w-5xl bg-[#0e0e13] border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden my-8"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-vibe-pink via-vibe-purple to-vibe-cyan"></div>
                
                <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-12">
                    <div>
                      <h1 className="text-4xl md:text-6xl font-headline font-bold text-white mb-2">Your Vibe Profile</h1>
                      <p className="text-slate-400 text-lg">A deep analysis of your aesthetic DNA based on your interactions.</p>
                    </div>
                    <button 
                      onClick={() => setShowVibeProfile(false)}
                      className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      <X className="w-8 h-8 text-slate-400 group-hover:text-white" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-vibe-cyan" />
                        Aesthetic Alignment
                      </h3>
                      <div className="space-y-6">
                        {[
                          { label: 'Cozy / Intimate', value: vibeProfile.cozy, color: 'bg-vibe-pink' },
                          { label: 'Quiet / Hushed', value: vibeProfile.quiet, color: 'bg-vibe-cyan' },
                          { label: 'Energetic / Social', value: vibeProfile.energetic, color: 'bg-vibe-purple' },
                          { label: 'Visual / Aesthetic', value: vibeProfile.aesthetic, color: 'bg-yellow-400' },
                          { label: 'Nature / Organic', value: vibeProfile.nature, color: 'bg-green-400' },
                        ].map((stat, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                              <span className="text-slate-400">{stat.label}</span>
                              <span className="text-white">{stat.value}%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${stat.value}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className={cn("h-full rounded-full", stat.color)}
                              ></motion.div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center items-center text-center">
                      <div className="relative w-48 h-48 mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <circle className="stroke-white/5" cx="18" cy="18" fill="none" r="16" strokeWidth="2"></circle>
                          <motion.circle 
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 100 - vibeProfile.aesthetic }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            cx="18" cy="18" fill="none" r="16" 
                            stroke="url(#profile-modal-gradient)" 
                            strokeDasharray="100" 
                            strokeLinecap="round" strokeWidth="2"
                          ></motion.circle>
                          <defs>
                            <linearGradient id="profile-modal-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                              <stop offset="0%" stopColor="#ff0080"></stop>
                              <stop offset="100%" stopColor="#00f2fe"></stop>
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-4xl font-black font-headline text-white">{vibeProfile.aesthetic}%</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aesthetic</div>
                        </div>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">The Aesthetic Curator</h4>
                      <p className="text-slate-400 text-sm max-w-xs">
                        You have a refined eye for visually stunning spaces and intimate atmospheres. You prioritize "vibe" over utility.
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-vibe-pink" />
                      Vibe Recommendations for You
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: 'Neon Speakeasies', match: '98%', desc: 'Based on your love for dim lighting and social buzz.' },
                        { title: 'Minimalist Lofts', match: '94%', desc: 'Matches your high aesthetic alignment score.' },
                        { title: 'Secret Gardens', match: '89%', desc: 'A perfect blend of nature and quiet intimacy.' },
                      ].map((rec, i) => (
                        <div 
                          key={i} 
                          className="p-6 rounded-2xl border bg-white/5 border-white/10 hover:border-vibe-pink/30 transition-all cursor-pointer group"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-white group-hover:text-vibe-pink transition-colors">{rec.title}</h4>
                            <span className="text-[10px] font-bold text-vibe-pink">{rec.match} Match</span>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{rec.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Home View */}
        {!results && !isLoading && !selectedPlace && !showAllMoods && !showTrending && !showMap && !showVault && !showProfile && !showVibeProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full flex flex-col items-center"
          >
            {/* Hero Section */}
            <section className="text-center mb-16 space-y-8 relative z-10">
              <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-bold tracking-widest text-[#ff0080] uppercase mb-4">
                Stop searching. Start feeling.
              </div>
              <h1 className="text-6xl md:text-8xl font-headline font-bold tracking-tighter leading-[1.1]">
                <span className="vibe-gradient-text">Find your Vibe.</span>
              </h1>
              <p className="text-slate-400 text-xl md:text-2xl font-light max-w-2xl mx-auto leading-relaxed">
                Describe how you feel. We'll find where you belong.
              </p>
            </section>

            {/* Main Search Area */}
            <div className="w-full max-w-3xl relative group mb-16">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#ff0080] via-[#7928ca] to-[#00f2fe] rounded-full blur-2xl opacity-25 group-focus-within:opacity-50 transition-opacity duration-500"></div>
              <form onSubmit={handleSearch} className="relative bg-white/[0.03] backdrop-blur-3xl rounded-full p-2 border border-white/10 shadow-2xl flex items-center group-focus-within:border-white/20 transition-all">
                <div className="flex-1 px-6 md:px-8 flex items-center gap-4">
                  <svg className="text-[#ff0080] w-6 h-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor"/>
                    <path d="M19 4L19.5 5.5L21 6L19.5 6.5L19 8L18.5 6.5L17 6L18.5 5.5L19 4Z" fill="currentColor"/>
                    <path d="M5 18L5.5 19.5L7 20L5.5 20.5L5 22L4.5 20.5L3 20L4.5 19.5L5 18Z" fill="currentColor"/>
                  </svg>
                  <input 
                    className="bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 w-full py-4 md:py-5 text-lg md:text-xl font-light outline-none" 
                    placeholder="I want a sunlit cafe with plants and jazz..." 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="hidden sm:flex flex-col items-end mr-4 shrink-0">
                    <div className="text-[8px] text-vibe-cyan uppercase tracking-widest font-bold">Aura Status</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-vibe-cyan fill-vibe-cyan" />
                      <span className="text-[10px] text-white font-bold">Unlimited</span>
                    </div>
                  </div>
                </div>

                <button type="submit" className="vibe-gradient-bg text-white font-bold px-6 md:px-10 py-4 md:py-5 rounded-full hover:shadow-[0_0_30px_rgba(121,40,202,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 group/btn shadow-xl shrink-0">
                  <span className="hidden md:inline">Check IQ</span>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </button>
              </form>
              {/* Pulse Loader */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 overflow-hidden rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-700">
                <div className="pulse-loader"></div>
              </div>
            </div>

            {/* Category Grid (Moved here) */}
            <section className="w-full mb-32">
              <div className="flex items-center justify-between mb-12">
                <h3 className="font-headline text-lg font-bold tracking-tight text-white flex items-center gap-3">
                  <span className="w-8 h-[2px] vibe-gradient-bg"></span>
                  Trending Categories
                </h3>
                <button onClick={() => { if(!user){setShowAuthModal(true); return;} setShowAllMoods(true); }} className="text-slate-500 hover:text-[#ff0080] transition-colors text-sm font-medium flex items-center gap-1">
                  View all moods <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {VIBE_OPTIONS.slice(0, 5).map((vibe, idx) => (
                  <button 
                    key={vibe.id}
                    onClick={() => {
                      if (!user) {
                        setShowAuthModal(true);
                        return;
                      }
                      setSelectedVibe(vibe);
                      handleSearch(undefined, vibe.prompt);
                    }}
                    className={cn(
                      "group p-6 rounded-3xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all hover:-translate-y-2 flex flex-col items-center text-center",
                      idx === 4 ? "hidden lg:flex" : ""
                    )}
                  >
                    <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", vibe.color)}>
                      {vibe.icon}
                    </div>
                    <span className="font-headline font-bold text-white">{vibe.label}</span>
                    <span className="text-xs text-slate-500 mt-1">{vibe.count}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Premium Hero Image Collage */}
            <section className="w-full mb-32 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[3]); }} className="h-[400px] rounded-[2.5rem] overflow-hidden relative group cursor-pointer border border-white/5">
                <img alt="Sunlit Cafe" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={FEATURED_PLACES[3].image}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">Morning Ritual</span>
                  <h3 className="text-2xl font-headline font-bold text-white">Golden Hour Sanctuary</h3>
                </div>
              </div>
              <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[4]); }} className="h-[400px] rounded-[2.5rem] overflow-hidden relative group cursor-pointer border border-white/5 md:mt-12">
                <img alt="Neon Lounge" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={FEATURED_PLACES[4].image}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">Night Life</span>
                  <h3 className="text-2xl font-headline font-bold text-white">Electric Pulse</h3>
                </div>
              </div>
              <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[5]); }} className="h-[400px] rounded-[2.5rem] overflow-hidden relative group cursor-pointer border border-white/5">
                <img alt="Peaceful Nature" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={FEATURED_PLACES[5].image}/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                  <span className="text-white/60 text-xs font-bold tracking-widest uppercase mb-1">Serene Escape</span>
                  <h3 className="text-2xl font-headline font-bold text-white">Ethereal Woodlands</h3>
                </div>
              </div>
            </section>



            {/* Featured Discovery Grid */}
            <section className="w-full">
              <div className="mb-12">
                <h3 className="font-headline text-3xl font-bold text-white mb-2">Editor's Choice</h3>
                <p className="text-slate-500">Hand-picked environments for maximum inspiration.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Major Feature */}
                <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[0]); }} className="md:col-span-8 group relative overflow-hidden rounded-[3rem] bg-[#1f1f26] border border-white/5 hover:border-[#ff0080]/30 transition-all duration-700 shadow-2xl aspect-[16/9] cursor-pointer">
                  <img alt="The Velvet Underground" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src={FEATURED_PLACES[0].image}/>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 md:p-12 flex flex-col justify-end">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="vibe-gradient-bg text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Vibe Match 98%</span>
                      <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">Boutique Cafe</span>
                    </div>
                    <h4 className="text-3xl md:text-4xl font-headline font-bold text-white mb-3">The Velvet Underground</h4>
                    <p className="text-slate-300 text-base md:text-lg font-light max-w-lg">Deep focus meets melancholic jazz. The ultimate sanctuary for creators and thinkers.</p>
                  </div>
                </div>
                {/* Secondary Feature */}
                <div className="md:col-span-4 grid grid-rows-2 gap-8">
                  <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[1]); }} className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-[#00f2fe]/30 transition-all duration-500 cursor-pointer">
                    <img alt="Neon Pulse Labs" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" src={FEATURED_PLACES[1].image}/>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <h4 className="text-2xl font-headline font-bold text-white mb-1">Neon Pulse Labs</h4>
                      <p className="text-slate-400 text-sm">High-tech performance environments.</p>
                    </div>
                  </div>
                  <div onClick={() => { if(!user){setShowAuthModal(true); return;} setSelectedPlace(FEATURED_PLACES[2]); }} className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/5 hover:border-[#ff0080]/30 transition-all duration-500 cursor-pointer">
                    <img alt="Eclipse Lounge" className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" src={FEATURED_PLACES[2].image}/>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <h4 className="text-2xl font-headline font-bold text-white mb-1">Eclipse Lounge</h4>
                      <p className="text-slate-400 text-sm">Minimalist luxury and fine spirits.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}

        {/* All Moods View */}
        {showAllMoods && !isLoading && !selectedPlace && !results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-6xl mx-auto"
          >
            <button onClick={() => setShowAllMoods(false)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5 rotate-180" />
              Back to Home
            </button>

            <header className="mb-12 text-center">
              <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-4">
                Explore <span className="vibe-gradient-text">All Moods</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Browse our complete collection of neuro-aesthetic frequencies to find your perfect environment.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {VIBE_OPTIONS.map((vibe) => (
                <button 
                  key={vibe.id}
                  onClick={() => {
                    if (!user) {
                      setShowAuthModal(true);
                      return;
                    }
                    setShowAllMoods(false);
                    setSelectedVibe(vibe);
                    handleSearch(undefined, vibe.prompt);
                  }}
                  className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all hover:-translate-y-2 flex flex-col items-start text-left relative overflow-hidden"
                >
                  <div className={cn("absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-gradient-to-br", vibe.color)}></div>
                  
                  <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10", vibe.color)}>
                    {vibe.icon}
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-white mb-2 relative z-10">{vibe.label}</h3>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2 relative z-10">{vibe.prompt}</p>
                  <div className="mt-auto flex items-center justify-between w-full relative z-10">
                    <span className="text-xs font-bold text-[#ff0080] uppercase tracking-widest">{vibe.count}</span>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trending View */}
        {showTrending && !isLoading && !selectedPlace && !results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-7xl mx-auto px-4"
          >
            <header className="mb-16 relative">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-vibe-pink/10 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-vibe-cyan mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibe-cyan opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-vibe-cyan"></span>
                  </span>
                  Live Aesthetic Pulse
                </div>
                <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter mb-6">
                  Trending <span className="vibe-gradient-text">Categories</span>
                </h1>
                <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light leading-relaxed">
                  The most sought-after neuro-aesthetic categories near you, updated in real-time.
                </p>
              </div>
            </header>

            {/* Trending Moods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
              {trendingMoods.map((mood, idx) => (
                <motion.button 
                  key={mood.id || idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => {
                    setSearchQuery(mood.prompt);
                    handleSearch(undefined, mood.prompt);
                  }}
                  className="group p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all hover:-translate-y-2 flex flex-col items-start text-left relative overflow-hidden h-[350px]"
                >
                  <div className={cn("absolute -right-10 -top-10 w-60 h-60 rounded-full blur-[80px] opacity-10 group-hover:opacity-30 transition-opacity bg-gradient-to-br", mood.color || 'from-vibe-pink to-vibe-purple')}></div>
                  
                  <div className="absolute top-8 right-8">
                    <div className="bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-vibe-cyan">
                      {mood.popularity} Trending
                    </div>
                  </div>

                  <div className={cn("w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-8 group-hover:scale-110 transition-transform relative z-10 shadow-2xl", mood.color || 'from-vibe-pink to-vibe-purple')}>
                    <span className="text-4xl">{mood.icon}</span>
                  </div>

                  <h3 className="font-headline text-3xl font-bold text-white mb-3 relative z-10 tracking-tight">{mood.title}</h3>
                  <p className="text-slate-400 text-lg mb-8 line-clamp-2 relative z-10 font-light leading-relaxed">{mood.description}</p>
                  
                  <div className="mt-auto flex items-center justify-between w-full relative z-10">
                    <span className="text-xs font-bold text-vibe-pink uppercase tracking-[0.2em]">Explore Vibe</span>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-vibe-pink group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Trending Stats / Social Proof */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
              {[
                { label: 'Active Check-ins', value: '1,284', icon: <MapPin className="w-5 h-5" /> },
                { label: 'Vibe Score Avg', value: '94.2%', icon: <Sparkles className="w-5 h-5" /> },
                { label: 'Trending Now', value: trendingMoods[0]?.title || 'Neon Pulse', icon: <Zap className="w-5 h-5" /> }
              ].map((stat, i) => (
                <div key={i} className="glass-panel p-8 rounded-[2rem] flex items-center gap-6 border border-white/5">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-vibe-pink">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Vibe Map View */}
        {showMap && !isLoading && !selectedPlace && !results && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-6xl mx-auto h-[70vh] min-h-[600px] relative rounded-[3rem] overflow-hidden border border-white/10"
          >
            <div className="absolute inset-0 bg-[#0e0e13] flex flex-col items-center justify-center text-center p-8 z-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ff0080]/20 to-[#00f2fe]/20 flex items-center justify-center mb-8 border border-white/10 relative">
                <div className="absolute inset-0 rounded-full border border-[#ff0080]/50 animate-ping opacity-20"></div>
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-headline font-bold text-white mb-4">Neuro-Spatial Map</h2>
              <p className="text-slate-400 text-lg max-w-xl mb-8">
                Interactive vibe mapping is currently calibrating for your region. We are scanning local frequencies to build the ultimate aesthetic atlas.
              </p>
              <button onClick={() => setShowMap(false)} className="vibe-gradient-bg text-white font-bold px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(121,40,202,0.4)] transition-all">
                Return to Explore
              </button>
            </div>
          </motion.div>
        )}

        {/* Place Details View */}
        {selectedPlace && !isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto"
          >
            <button onClick={() => setSelectedPlace(null)} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowRight className="w-5 h-5 rotate-180" />
              Back to Explore
            </button>
            
            <div className="glass-panel rounded-[3rem] overflow-hidden">
              <div className="h-[400px] relative w-full">
                <img src={selectedPlace.image} alt={selectedPlace.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent" />
                
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="vibe-gradient-bg text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">Vibe Match {selectedPlace.match}%</span>
                    <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">{selectedPlace.type}</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-headline font-bold text-white mb-4">{selectedPlace.title}</h1>
                  <p className="text-xl text-slate-300 max-w-2xl">{selectedPlace.description}</p>
                </div>
              </div>
              
              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-2xl font-headline font-bold mb-4 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-[#ff0080]" />
                      The Vibe
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-lg italic border-l-2 border-[#ff0080]/30 pl-4">
                      "{selectedPlace.snippet}"
                    </p>
                  </div>
                  
                  <div className="flex gap-6 border-y border-white/10 py-6">
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Rating</div>
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        {selectedPlace.rating} <span className="text-slate-500 text-sm font-normal">({selectedPlace.reviews})</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Distance</div>
                      <div className="font-bold text-lg">{selectedPlace.distance}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-sm mb-1">Price</div>
                      <div className="font-bold text-lg">{selectedPlace.price}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <a 
                    href={selectedPlace.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowAuthModal(true);
                      }
                    }}
                    className="w-full block bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white py-5 rounded-2xl font-bold text-center hover:scale-[1.01] active:scale-95 transition-all shadow-[0_0_20px_rgba(255,0,128,0.3)] signature-pulse text-lg"
                  >
                    Visit / Book
                  </a>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleShare(selectedPlace.title, `Check out this vibe: ${selectedPlace.title} - ${selectedPlace.description}`, selectedPlace.url)}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-slate-300 hover:text-white group/share"
                    >
                      <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">Share</span>
                    </button>
                    
                    <div className="relative group/save-detail">
                      <button 
                        onClick={(e) => {
                          if (!user) {
                            e.preventDefault();
                            setShowAuthModal(true);
                            return;
                          }
                          const isSaved = savedVibes.find(v => v.url === selectedPlace.url);
                          if (isSaved) {
                            toggleSaveVibe(selectedPlace);
                          } else {
                            toggleSaveVibe(selectedPlace, 'Relax');
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-center gap-2 py-4 rounded-2xl border transition-all font-bold",
                          savedVibes.find(v => v.url === selectedPlace.url) 
                            ? "bg-white/10 border-white/20 text-white" 
                            : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Bookmark className={cn("w-5 h-5 transition-transform", savedVibes.find(v => v.url === selectedPlace.url) ? "fill-white scale-110" : "group-hover/save-detail:scale-110")} />
                        <span className="text-sm">{savedVibes.find(v => v.url === selectedPlace.url) ? "Saved" : "Save"}</span>
                      </button>

                      {!savedVibes.find(v => v.url === selectedPlace.url) && user && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-full bg-[#1a1a24] border border-white/10 rounded-2xl p-3 shadow-2xl opacity-0 invisible group-hover/save-detail:opacity-100 group-hover/save-detail:visible transition-all flex justify-around gap-2 z-50">
                          {(['Work', 'Relax', 'Night'] as const).map(cat => (
                            <button 
                              key={cat}
                              onClick={() => toggleSaveVibe(selectedPlace, cat)}
                              className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      if (!user) {
                        e.preventDefault();
                        setShowAuthModal(true);
                        return;
                      }
                      setShowReviewModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-vibe-cyan/5 border border-vibe-cyan/20 text-vibe-cyan hover:bg-vibe-cyan/10 transition-all font-bold group/review"
                  >
                    <Star className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg">Leave a Review (+100 Pts)</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results View */}
        {results && !isLoading && !selectedPlace && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto"
          >
            {/* Header Section */}
            <header className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-6xl font-headline font-bold tracking-tight mb-4">
                    Results for <span className="vibe-gradient-text">{results.query}</span>
                  </h1>
                  <p className="text-slate-400 text-lg max-w-2xl">
                    We've analyzed locations to find spaces that match your current neuro-aesthetic frequency.
                  </p>
                </div>
                {!user && (
                  <button 
                    onClick={() => setShowAuthModal(true)}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center gap-2 shrink-0"
                  >
                    <User className="w-4 h-4 text-vibe-pink" />
                    Login to Save Results
                  </button>
                )}
              </div>
            </header>

            {/* AI Report Summary */}
            <div className="mb-12 glass-panel p-8 rounded-2xl border-l-4 border-[#00f2fe]">
              <div className="flex items-center gap-2 mb-4 text-[#00f2fe]">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold font-headline">Vibe Analysis</h3>
              </div>
              <div className={cn(
                "prose prose-invert max-w-none text-slate-300 relative transition-all duration-500",
                !isAnalysisExpanded && "max-h-32 overflow-hidden"
              )}>
                <Markdown>{results.text}</Markdown>
                {!isAnalysisExpanded && (
                  <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-[#1a1a24] to-transparent"></div>
                )}
              </div>
              <button 
                onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                className="mt-4 text-[#00f2fe] text-sm font-bold hover:underline flex items-center gap-1"
              >
                {isAnalysisExpanded ? "Show Less" : "Read More"}
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold font-headline text-xl text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-vibe-pink" />
                  Advanced Vibe Filters
                </h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: 'noise', label: 'Noise Level', icon: <Wind className="w-4 h-4" />, values: ['Silent', 'Ambient', 'Lively'] },
                  { id: 'lighting', label: 'Lighting', icon: <Moon className="w-4 h-4" />, values: ['Dim', 'Natural', 'Neon'] },
                  { id: 'crowd', label: 'Crowd', icon: <Users className="w-4 h-4" />, values: ['Empty', 'Cozy', 'Social'] },
                  { id: 'intensity', label: 'Intensity', icon: <Zap className="w-4 h-4" />, values: ['Chill', 'Moderate', 'High'] },
                ].map((filter, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-2xl border transition-all relative overflow-hidden group bg-white/5 border-white/10 hover:border-vibe-cyan/50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-vibe-cyan/10 text-vibe-cyan">
                        {filter.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{filter.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {filter.values.map((val, j) => (
                        <button 
                          key={j} 
                          onClick={(e) => {
                            if (!isPro) return;
                            e.stopPropagation();
                            setActiveFilters(prev => ({
                              ...prev,
                              [filter.id]: prev[filter.id as keyof typeof activeFilters] === val ? '' : val
                            }));
                          }}
                          className={cn(
                            "px-2 py-1 rounded-md text-[10px] transition-all",
                            activeFilters[filter.id as keyof typeof activeFilters] === val 
                              ? "bg-vibe-cyan text-black font-bold shadow-[0_0_10px_rgba(0,242,254,0.3)]" 
                              : "bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10"
                          )}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                    {!isPro && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                        <Lock className="w-5 h-5 text-white/40" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isPro && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex justify-center"
                >
                  <button 
                    onClick={() => handleSearch()}
                    className="px-8 py-3 rounded-xl bg-vibe-cyan text-black font-bold text-sm hover:shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Apply Filters & Search
                  </button>
                </motion.div>
              )}
            </div>

            {/* Results Header & Analysis Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white font-headline tracking-tight">
                  Vibe Matches for <span className="vibe-gradient-text">"{results.query}"</span>
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  We found {results.links.length} spots that match your aesthetic frequency.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleShare(`Vibe: ${results.query}`, `Check out these spots for ${results.query} on VibeIQ!`, window.location.href)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  Share this vibe
                </button>
                {results.text && (
                  <button 
                    onClick={() => setShowAnalysisModal(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-vibe-pink/10 border border-vibe-pink/20 text-vibe-pink font-bold text-xs hover:bg-vibe-pink/20 transition-all group"
                  >
                    <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
                    Read Vibe Analysis
                  </button>
                )}
              </div>
            </div>

            {/* Staggered Result Cards */}
            <div className="grid grid-cols-1 gap-8">
              {results.links.length > 0 ? (
                <>
                  {results.links.map((link, i) => {
                    const isSaved = savedVibes.find(v => v.url === link.url);
                    const vibeScore = Math.floor(Math.random() * 15) + 85; 
                    const isReverse = i % 2 !== 0;
                    const snippet = results.text.split('.').find(s => s.length > 20 && !s.includes('*')) || "An incredible spot with a unique atmosphere that perfectly matches the mood you're looking for today.";
                    
                    const placeObj = {
                      id: link.url || `result-${i}`,
                      title: link.title || 'Unknown Place',
                      type: selectedVibe?.label || 'Vibe Match',
                      match: vibeScore.toString(),
                      description: snippet.trim(),
                      image: `https://loremflickr.com/800/600/${selectedVibe?.id === 'nature' ? 'park' : selectedVibe?.id === 'night' ? 'bar,neon' : 'cafe,interior'}?lock=${i + (link.title?.length || 0)}`,
                      url: link.url,
                      rating: (4 + Math.random()).toFixed(1),
                      reviews: Math.floor(Math.random() * 500) + 50,
                      distance: (Math.random() * 5 + 0.1).toFixed(1) + ' miles',
                      price: '$$$',
                      snippet: snippet.trim()
                    };

                    const isLiked = likes.includes(placeObj.id);
                    const isDisliked = dislikes.includes(placeObj.id);

                    return (
                      <motion.div
                        key={`${link.url}-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "glass-panel rounded-xl overflow-hidden flex flex-col group hover:scale-[1.01] transition-all duration-500",
                          isReverse ? "md:flex-row-reverse hover:shadow-[0_0_40px_rgba(0,242,254,0.15)]" : "md:flex-row hover:shadow-[0_0_40px_rgba(121,40,202,0.15)]"
                        )}
                      >
                        <div 
                          className="relative w-full md:w-80 lg:w-96 shrink-0 h-64 md:h-auto overflow-hidden p-4 cursor-pointer"
                          onClick={() => setSelectedPlace(placeObj)}
                        >
                          <img 
                            src={placeObj.image} 
                            alt={link.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover rounded-xl transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className={cn(
                            "absolute top-8 bg-black/80 backdrop-blur-lg border px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg",
                            isReverse ? "right-8 border-[#ff0080]/30" : "left-8 border-[#00f2fe]/30"
                          )}>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isReverse ? "bg-[#ff0080] shadow-[0_0_8px_#ff0080]" : "bg-[#00f2fe] shadow-[0_0_8px_#00f2fe]"
                            )}></div>
                            <span className={cn(
                              "text-xs font-bold uppercase tracking-widest",
                              isReverse ? "text-[#ff0080]" : "text-[#00f2fe]"
                            )}>{vibeScore}% Vibe Match</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h2 
                                className={cn(
                                  "text-2xl font-headline font-bold text-white transition-colors cursor-pointer",
                                  isReverse ? "group-hover:text-[#00f2fe]" : "group-hover:text-[#ff0080]"
                                )}
                                onClick={() => setSelectedPlace(placeObj)}
                              >
                                {link.title}
                              </h2>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleLike(placeObj.id)}
                                  className={cn(
                                    "p-2 rounded-full transition-all",
                                    isLiked ? "bg-vibe-pink/20 text-vibe-pink" : "text-slate-500 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  <ThumbsUp className={cn("w-4 h-4", isLiked && "fill-vibe-pink")} />
                                </button>
                                <button 
                                  onClick={() => handleDislike(placeObj.id)}
                                  className={cn(
                                    "p-2 rounded-full transition-all",
                                    isDisliked ? "bg-slate-700 text-white" : "text-slate-500 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  <ThumbsDown className={cn("w-4 h-4", isDisliked && "fill-white")} />
                                </button>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg ml-2">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-bold">{placeObj.rating}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-4 text-slate-400 text-sm mb-6 font-medium">
                              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {placeObj.distance}</span>
                              <span className="flex items-center gap-1">{placeObj.price}</span>
                            </div>
                            <p className={cn(
                              "text-lg italic mb-6 font-light leading-relaxed border-l-2 pl-4",
                              isReverse ? "text-[#00f2fe]/90 border-[#00f2fe]/30" : "text-[#ff0080]/90 border-[#ff0080]/30"
                            )}>
                              "{snippet.trim()}"
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <a 
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (!user) {
                                  e.preventDefault();
                                  setShowAuthModal(true);
                                }
                              }}
                              className={cn(
                                "px-8 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-all text-center",
                                isReverse ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white" : "bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white signature-pulse"
                              )}
                            >
                              Visit / Book
                            </a>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleShare(placeObj.title, `Check out this vibe: ${placeObj.title} - ${placeObj.description}`, link.url)}
                                className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors active:scale-90"
                              >
                                <Share2 className="w-5 h-5 text-slate-400" />
                              </button>
                              <div className="relative group/save">
                              <button 
                                onClick={(e) => {
                                  if (!user) {
                                    e.preventDefault();
                                    setShowAuthModal(true);
                                    return;
                                  }
                                  if (isSaved) {
                                    toggleSaveVibe(link);
                                  } else {
                                    toggleSaveVibe(link, 'Relax');
                                  }
                                }}
                                className={cn(
                                  "w-12 h-12 rounded-full border flex items-center justify-center transition-colors active:scale-90",
                                  isSaved ? "bg-white/10 border-white/20" : "border-white/10 hover:bg-white/5"
                                )}
                              >
                                <Bookmark className={cn("w-5 h-5", isSaved ? "fill-white text-white" : "text-slate-400")} />
                              </button>
                              
                              {!isSaved && user && (
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a24] border border-white/10 rounded-xl p-2 shadow-2xl opacity-0 invisible group-hover/save:opacity-100 group-hover/save:visible transition-all flex flex-col gap-1 z-50">
                                  {(['Work', 'Relax', 'Night'] as const).map(cat => (
                                    <button 
                                      key={cat}
                                      onClick={() => toggleSaveVibe(link, cat)}
                                      className="px-4 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                      Save to {cat}
                                    </button>
                                  ))}
                                </div>
                              )}
                              </div>
                            </div>
                            
                            {/* Signature Vibe Score Visual */}
                            <div className="ml-auto flex items-center gap-3">
                              <div className="relative w-14 h-14">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                  <circle className="stroke-white/5" cx="18" cy="18" fill="none" r="16" strokeWidth="2.5"></circle>
                                  <motion.circle 
                                    initial={{ strokeDashoffset: 100 }}
                                    animate={{ strokeDashoffset: 100 - vibeScore }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    cx="18" cy="18" fill="none" r="16" 
                                    stroke={`url(#vibe-gradient-${i})`} 
                                    strokeDasharray="100" 
                                    strokeLinecap="round" strokeWidth="2.5"
                                  ></motion.circle>
                                  <defs>
                                    <linearGradient id={`vibe-gradient-${i}`} x1="0%" x2="100%" y1="0%" y2="100%">
                                      <stop offset="0%" stopColor={isReverse ? "#7928ca" : "#ff0080"}></stop>
                                      <stop offset="100%" stopColor="#00f2fe"></stop>
                                    </linearGradient>
                                  </defs>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black font-headline">{vibeScore}%</div>
                              </div>
                              <div className="text-right hidden sm:block">
                                <div className="text-xs font-bold uppercase tracking-tighter text-slate-400">Vibe Score</div>
                                <div className={cn("text-[10px] font-medium", isReverse ? "text-[#ff0080]" : "text-[#00f2fe]")}>
                                  {vibeScore > 90 ? "Hyper-Compatible" : "Flow State Enabled"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                <p className="text-gray-500 italic">No direct map links found, but check the analysis above!</p>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Side Drawers */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-80 z-[70] bg-[#0e0e13]/90 backdrop-blur-2xl border-l border-white/5 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col p-6 gap-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                    <History className="w-6 h-6 text-[#00f2fe]" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-base">History</h4>
                    <p className="text-slate-500 text-xs">Past frequencies</p>
                  </div>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {history.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-slate-500 text-sm">No history yet.</p>
                  </div>
                ) : (
                  history.map(item => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        setSearchQuery(item.query);
                        setShowHistory(false);
                        handleSearch(undefined, item.query);
                      }}
                      className="w-full text-left p-4 glass-panel rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-sm text-gray-300 truncate pr-4">{item.query}</span>
                      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-white/5 bg-[#0a0a0f] relative z-10 mt-auto overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-vibe-pink/50 to-transparent"></div>
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-vibe-pink/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col items-center gap-10 max-w-7xl mx-auto px-8 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <span className="font-headline font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff0080] via-[#7928ca] to-[#00f2fe] text-4xl tracking-tighter">VibeIQ</span>
            <p className="text-slate-400 text-sm max-w-md text-center font-light">
              Curating the world's aesthetic frequencies. Find your place in the noise.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            <a href="#" className="text-slate-500 text-xs uppercase tracking-widest hover:text-[#ff0080] transition-colors hover:scale-105 transform">Discord</a>
            <a href="#" className="text-slate-500 text-xs uppercase tracking-widest hover:text-[#7928ca] transition-colors hover:scale-105 transform">X</a>
            <a href="#" className="text-slate-500 text-xs uppercase tracking-widest hover:text-[#00f2fe] transition-colors hover:scale-105 transform">Instagram</a>
            <a href="#" className="text-slate-500 text-xs uppercase tracking-widest hover:text-white transition-colors hover:scale-105 transform">Privacy</a>
            <a href="#" className="text-slate-500 text-xs uppercase tracking-widest hover:text-white transition-colors hover:scale-105 transform">Terms</a>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em]">© 2026 VibeIQ. Engineered for the future.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {/* Login Success Toast */}
      <AnimatePresence>
        {showLoginSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-[110] w-full max-w-sm px-4"
          >
            <div className="p-4 rounded-2xl shadow-lg flex items-center gap-4 bg-white/10 backdrop-blur-md text-white border border-white/10">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-vibe-pink/20">
                <User className="w-6 h-6 text-vibe-pink" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">
                  Welcome back, {userName || user?.email?.split('@')[0] || 'Explorer'}!
                </div>
                <div className="text-[10px] opacity-80">
                  Successfully logged in to your account.
                </div>
              </div>
              <button onClick={() => setShowLoginSuccess(false)} className="p-1 hover:bg-black/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewardsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRewardsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"></div>
              
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center border border-[#00f2fe]/20">
                    <Sparkles className="w-6 h-6 text-[#00f2fe]" />
                  </div>
                  <button onClick={() => setShowRewardsModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 font-headline tracking-tight">Vibe Points & Rewards</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Earn points by exploring the city, curating your Vault, and sharing your aesthetic discoveries.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#ff0080]/10 flex items-center justify-center text-[#ff0080] font-bold text-sm">+50</div>
                    <div>
                      <h4 className="text-white text-sm font-bold">Visit a Place</h4>
                      <p className="text-slate-500 text-xs">Check in to a curated location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#7928ca]/10 flex items-center justify-center text-[#7928ca] font-bold text-sm">+20</div>
                    <div>
                      <h4 className="text-white text-sm font-bold">Curate Vault</h4>
                      <p className="text-slate-500 text-xs">Save a new spot to your collection</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-[#00f2fe]/10 flex items-center justify-center text-[#00f2fe] font-bold text-sm">+100</div>
                    <div>
                      <h4 className="text-white text-sm font-bold">Leave a Review</h4>
                      <p className="text-slate-500 text-xs">Share your aesthetic experience</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[#ff0080]/10 to-[#7928ca]/10 border border-[#ff0080]/20">
                    <div className="w-10 h-10 rounded-full bg-[#ff0080]/20 flex items-center justify-center text-[#ff0080] font-bold text-sm">+500</div>
                    <div className="flex-1">
                      <h4 className="text-white text-sm font-bold">Refer a Friend</h4>
                      <p className="text-slate-400 text-xs">Invite someone to VibeIQ</p>
                    </div>
                    <button 
                      onClick={() => showNotification('Referral link copied to clipboard!', 'success')}
                      className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors active:scale-95"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/10">
                  <p className="text-xs text-slate-500 text-center mb-4">Redeem points for Pro features, exclusive aesthetic drops, and partner discounts.</p>
                  <button className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors">
                    View Rewards Catalog
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"></div>
              
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#00f2fe]/10 flex items-center justify-center border border-[#00f2fe]/20">
                    <Star className="w-6 h-6 text-[#00f2fe]" />
                  </div>
                  <button onClick={() => setShowReviewModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2 font-headline tracking-tight">Leave a Review</h3>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Share your experience at <span className="text-white font-bold">{selectedPlace?.title}</span> and earn +100 Vibe Points.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Your Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star className={cn("w-8 h-8", reviewRating >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-600")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Your Vibe Check</label>
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What was the atmosphere like? How was the lighting, music, and energy?"
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-[#00f2fe]/50 focus:ring-1 focus:ring-[#00f2fe]/50 resize-none"
                    ></textarea>
                  </div>
                  
                  <button 
                    onClick={() => {
                      const newReview: Review = {
                        id: Date.now().toString(),
                        author: userName || user?.email?.split('@')[0] || 'You',
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || user?.email}&backgroundColor=ff0080,7928ca,00f2fe`,
                        rating: reviewRating,
                        text: reviewText,
                        auraLevel: (Math.random() * 2 + 8).toFixed(1),
                        color: '#00f2fe'
                      };
                      setReviews([newReview, ...reviews]);
                      setShowReviewModal(false);
                      setReviewText('');
                      setReviewRating(0);
                      showNotification('Review submitted! You earned +100 Vibe Points.', 'success');
                    }}
                    disabled={!reviewRating || !reviewText.trim()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review (+100 Pts)
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vibe Points Explanation Modal */}
      <AnimatePresence>
        {showPointsInfo && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPointsInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg bg-[#0e0e13] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#ff0080] via-[#7928ca] to-[#00f2fe]"></div>
              
              <div className="p-8 md:p-12">
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-vibe-cyan/20 blur-2xl rounded-full animate-pulse"></div>
                    <div className="w-20 h-20 rounded-3xl vibe-gradient-bg flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(0,242,254,0.4)]">
                      <Zap className="w-10 h-10 text-white fill-white" />
                    </div>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <h3 className="text-3xl font-bold text-white mb-4 font-headline tracking-tight">
                    Welcome to the <span className="vibe-gradient-text">Aura Economy</span>
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    You've just unlocked your first <span className="text-white font-bold">Vibe Points</span>. Here's how you can master the aesthetic frequency.
                  </p>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-vibe-pink/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-vibe-pink" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Earn by Exploring</h4>
                      <p className="text-xs text-slate-500">Check in to new places, leave reviews, and curate your Vault to stack points.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-vibe-cyan/20 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-vibe-cyan" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Unlock Exclusive Perks</h4>
                      <p className="text-xs text-slate-500">Redeem points for Pro features, exclusive Vibe drops, and real-world rewards.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#7928ca]/20 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#7928ca]" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm mb-1">Level Up Your Aura</h4>
                      <p className="text-xs text-slate-500">The more points you have, the higher your Vibe Status. Become a Master Curator.</p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowPointsInfo(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(255,0,128,0.3)] active:scale-95"
                >
                  Start Earning
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewPrompt && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewPrompt(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#0e0e13] border border-white/10 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl"
            >
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-vibe-pink/20 rounded-full blur-3xl pointer-events-none" />
              
              <button 
                onClick={() => setShowReviewPrompt(false)}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="text-center relative z-10">
                <div className="w-20 h-20 bg-vibe-pink/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(255,0,128,0.2)]">
                  <Heart className="w-10 h-10 text-vibe-pink fill-vibe-pink" />
                </div>
                <h2 className="text-3xl font-bold mb-3 font-headline tracking-tight">Enjoying VibeIQ?</h2>
                <p className="text-slate-400 mb-10 text-lg">
                  You just saved a vibe! Would you like to leave a quick review and earn <span className="text-vibe-cyan font-bold">+100 Vibe Points</span>?
                </p>
                
                <div className="space-y-4">
                  <button 
                    onClick={() => {
                      setShowReviewPrompt(false);
                      setShowReviewModal(true);
                    }}
                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-vibe-pink to-vibe-purple text-white font-bold hover:shadow-[0_0_20px_rgba(255,0,128,0.4)] transition-all active:scale-[0.98]"
                  >
                    Leave a Review
                  </button>
                  <button 
                    onClick={() => setShowReviewPrompt(false)}
                    className="w-full py-5 rounded-2xl bg-white/5 text-slate-400 font-bold hover:bg-white/10 hover:text-white transition-all"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
