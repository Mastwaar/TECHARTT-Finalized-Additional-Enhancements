import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Gift, 
  Filter, 
  Plus, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle,
  X, 
  ChevronRight,
  Info,
  Layers,
  Palette,
  Sun,
  Menu,
  Briefcase,
  Heart,
  UserCircle,
  LogOut,
  Settings,
  Trash2,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  Link,
  Send,
  Search,
  Loader2,
  Lock,
  Layout,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Image as ImageIcon
} from "lucide-react";
import { 
  Category, 
  Season, 
  Formality, 
  Occasion, 
  WardrobeItem, 
  CatalogItem, 
  StylistFilters, 
  WardrobeAnalysis,
  GiftModeConfig,
  SubscriptionTier,
  CartItem,
  User,
  SavedRecommendation,
  StyleScore,
  ChatMessage
} from "./types";
import { CATALOG_ITEMS, ACCESSORIES } from "./constants";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile as updateFBProfile
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot,
  deleteDoc, 
  query, 
  where, 
  serverTimestamp,
  orderBy,
  Timestamp
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { 
  analyzeWardrobeItem, 
  getRecommendationReasoning, 
  parseOutfitQuery, 
  ParsedQuery, 
  getStylistAdvice,
  getStyleScore,
  chatWithStylist
} from "./services/aiService";
import { useActivityLogger, trackActivity } from "./services/activityService";
import { RetailerDashboard } from "./components/RetailerDashboard";

// --- Components ---

const ShareModal = ({ 
  isOpen, 
  onClose, 
  item,
  recipientName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  item: CatalogItem | null,
  recipientName: string
}) => {
  if (!item) return null;

  const shareUrl = `${window.location.origin}/gift/${item.id}`;
  const shareText = `Hey ${recipientName}, I found this perfect gift for you on Aura AI Stylist! Check it out: ${item.brand} ${item.category}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied to clipboard!");
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`, '_blank');
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=A Gift Idea for You&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-display font-bold text-navy">Share Gift Idea</h3>
              <p className="text-cool-gray text-xs">Send this curated selection to {recipientName || 'someone special'}.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button 
                onClick={shareWhatsApp}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all group"
              >
                <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase">WhatsApp</span>
              </button>
              <button 
                onClick={shareEmail}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all group"
              >
                <Mail className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase">Email</span>
              </button>
              <button 
                onClick={copyToClipboard}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-cool-gray/5 text-navy hover:bg-cool-gray/10 transition-all group"
              >
                <Copy className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase">Copy</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 space-y-2">
              <label className="text-[10px] font-bold uppercase text-cool-gray tracking-widest">Shareable Link</label>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-cool-gray/10">
                <Link className="w-3 h-3 text-cool-gray flex-shrink-0" />
                <input 
                  readOnly 
                  value={shareUrl} 
                  className="flex-1 bg-transparent text-[10px] text-navy font-mono outline-none truncate" 
                />
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all"
            >
              Done
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Header = ({ 
  onViewChange, 
  currentView, 
  cartCount, 
  onCartOpen,
  onSignInOpen,
  tier,
  user,
  onLogout,
  isGiftModeActive,
  language,
  setLanguage
}: { 
  onViewChange: (view: string) => void, 
  currentView: string, 
  cartCount: number, 
  onCartOpen: () => void,
  onSignInOpen: () => void,
  tier: SubscriptionTier,
  user: User | null,
  onLogout: () => void,
  isGiftModeActive: boolean,
  language: "en" | "es",
  setLanguage: (lang: "en" | "es") => void
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isEs = language === "es";
  const t = {
    retailer: isEs ? "Dashboard Retail" : "Retailer Dashboard",
    stylist: isEs ? "Estilista" : "Stylist",
    dashboard: isEs ? "Panel" : "Dashboard",
    pricing: isEs ? "Precios" : "Pricing",
    profile: isEs ? "Perfil" : "Profile",
    giftResults: isEs ? "Resultados de Regalo" : "Gift Results",
    signIn: isEs ? "Iniciar Sesión" : "Sign In",
    logout: isEs ? "Cerrar Sesión" : "Logout",
  };

  const NavLinks = () => (
    <>
      <button 
        onClick={() => { onViewChange('retailer-dashboard'); setIsMobileMenuOpen(false); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy text-white text-[10px] font-bold uppercase tracking-widest hover:bg-navy/90 transition-all ${currentView === 'retailer-dashboard' ? 'ring-2 ring-accent' : ''}`}
      >
        <Layout className="w-3.5 h-3.5 text-accent" />
        {t.retailer}
      </button>
      <button 
        onClick={() => { onViewChange('stylist'); setIsMobileMenuOpen(false); }}
        className={`hover:text-accent transition-colors ${currentView === 'stylist' ? 'text-accent' : ''}`}
      >
        {t.stylist}
      </button>
      <button 
        onClick={() => { onViewChange('dashboard'); setIsMobileMenuOpen(false); }}
        className={`hover:text-accent transition-colors ${currentView === 'dashboard' ? 'text-accent' : ''}`}
      >
        {t.dashboard}
      </button>
      <button 
        onClick={() => { onViewChange('pricing'); setIsMobileMenuOpen(false); }}
        className={`hover:text-accent transition-colors ${currentView === 'pricing' ? 'text-accent' : ''}`}
      >
        {t.pricing}
      </button>
      {user && (
        <button 
          onClick={() => { onViewChange('profile'); setIsMobileMenuOpen(false); }}
          className={`hover:text-accent transition-colors ${currentView === 'profile' ? 'text-accent' : ''}`}
        >
          {t.profile}
        </button>
      )}
      {isGiftModeActive && (
        <button 
          onClick={() => { onViewChange('gift-results'); setIsMobileMenuOpen(false); }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 hover:bg-accent/20 transition-all ${currentView === 'gift-results' ? 'text-accent' : 'text-accent/80'}`}
        >
          <Gift className="w-3.5 h-3.5" />
          {t.giftResults}
        </button>
      )}
    </>
  );

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-cool-gray/10 px-6 py-4 flex justify-between items-center"
    >
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('stylist')}>
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-navy">AURA</span>
        <span className="ml-2 px-2 py-0.5 bg-cool-gray/10 text-[10px] font-bold rounded uppercase text-cool-gray">{tier}</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-cool-gray">
        <NavLinks />
      </nav>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Language Switcher Toggle */}
        <div className="flex items-center bg-cool-gray/5 border border-cool-gray/10 rounded-full p-0.5 text-xs font-semibold">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2 md:px-2.5 py-1 rounded-full transition-all text-[10px] md:text-xs ${language === 'en' ? 'bg-accent text-white shadow-sm font-bold' : 'text-cool-gray hover:text-navy'}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`px-2 md:px-2.5 py-1 rounded-full transition-all text-[10px] md:text-xs ${language === 'es' ? 'bg-accent text-white shadow-sm font-bold' : 'text-cool-gray hover:text-navy'}`}
          >
            ES
          </button>
        </div>

        <button 
          onClick={onCartOpen}
          className="relative p-2 rounded-full hover:bg-cool-gray/10 transition-colors"
        >
          <ShoppingBag className="w-5 h-5 text-navy" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
        
        {user ? (
          <div className="flex items-center gap-2 md:gap-3">
            <div 
              onClick={() => onViewChange('profile')}
              className="flex items-center gap-2 cursor-pointer hover:bg-cool-gray/5 px-2 md:px-3 py-1.5 rounded-full transition-all"
            >
              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-navy hidden sm:inline">{user.name}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-cool-gray hover:text-red-500 transition-colors hidden sm:block"
              title={t.logout}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={onSignInOpen}
            className="bg-navy text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-navy/90 transition-all shadow-lg text-[11px] sm:text-sm"
          >
            {t.signIn}
          </button>
        )}

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 md:hidden text-navy hover:bg-cool-gray/10 rounded-full transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-cool-gray/10 md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4 text-sm font-medium text-cool-gray">
              <NavLinks />
              {user && (
                <button 
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-2 text-red-500 pt-4 border-t border-cool-gray/5"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

const SignInModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        // After successful sign-in, onAuthStateChanged in App will trigger onSnapshot
        // and fetch user data, so we don't strictly need to do it here for global state,
        // but we can if we want immediate UI update before snapshot.
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        const fbUser = userCredential.user;
        
        await updateFBProfile(fbUser, { displayName: formData.name });
        
        const userRef = doc(db, "users", fbUser.uid);
        try {
          await setDoc(userRef, {
            uid: fbUser.uid,
            email: fbUser.email,
            name: formData.name,
            preferences: {
              style: 'Minimalist',
              colors: [],
              occasions: [],
              modestyEnforced: false,
              cultureRules: ''
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${fbUser.uid}`);
        }
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl space-y-8 overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-accent" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-navy">Success!</h3>
                  <p className="text-cool-gray text-sm">Welcome to your personalized style journey.</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-navy">
                      {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h3>
                    <p className="text-cool-gray text-sm">
                      {isLogin ? 'Sign in to access your digital wardrobe' : 'Join Aura to reimagine your style'}
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl text-center font-medium">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-cool-gray ml-1">Full Name</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Jane Doe" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy transition-all" 
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1">Email Address</label>
                      <input 
                        required
                        type="email" 
                        placeholder="hello@example.com" 
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1">Password</label>
                      <input 
                        required
                        type="password" 
                        placeholder="••••••••" 
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy transition-all" 
                      />
                    </div>
                    
                    {isLogin && (
                      <div className="flex justify-end">
                        <button type="button" className="text-[10px] font-bold text-accent hover:underline">Forgot Password?</button>
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-lg flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        isLogin ? 'Sign In' : 'Sign Up'
                      )}
                    </button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-cool-gray/10"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold">
                      <span className="bg-white px-4 text-cool-gray">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-cool-gray/10 hover:bg-cool-gray/5 transition-all text-sm font-medium text-navy">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-cool-gray/10 hover:bg-cool-gray/5 transition-all text-sm font-medium text-navy">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                      </svg>
                      GitHub
                    </button>
                  </div>

                  <p className="text-center text-xs text-cool-gray">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                    <button 
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-accent font-bold hover:underline"
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const Hero = ({ onGetStarted, onViewDashboard, isAdmin }: { onGetStarted: () => void, onViewDashboard: () => void, isAdmin?: boolean }) => (
  <section className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2
          }
        }
      }}
    >
      {isAdmin && (
        <motion.div 
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            visible: { opacity: 1, scale: 1 }
          }}
          className="flex justify-center mb-10"
        >
          <button 
            onClick={onViewDashboard}
            className="group flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-cool-gray/10 shadow-lg hover:shadow-xl hover:border-accent/40 transition-all cursor-pointer animate-bounce"
          >
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-cool-gray uppercase tracking-widest leading-none mb-0.5">Brand New</p>
              <p className="text-sm font-bold text-navy leading-none">Access Retailer Dashboard</p>
            </div>
            <ChevronRight className="w-4 h-4 text-cool-gray group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </button>
        </motion.div>
      )}

      <motion.span 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="inline-block px-4 py-1.5 bg-accent/10 text-accent rounded-full text-xs font-bold uppercase tracking-wider mb-6"
      >
        AI-Powered Personal Styling
      </motion.span>
      <motion.h1 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 text-navy"
      >
        Your Wardrobe, <br />
        <span className="text-accent">Intelligently</span> Reimagined.
      </motion.h1>
      <motion.p 
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 }
        }}
        className="text-cool-gray text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
      >
        Upload your collection and let Aura analyze your style, suggest perfect pairings, 
        and find the missing pieces that complete your look.
      </motion.p>
      <motion.button 
        variants={{
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onGetStarted}
        className="bg-navy text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-navy/90 transition-all flex items-center gap-2 mx-auto group fashion-shadow shadow-xl"
      >
        Start Styling <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>
    </motion.div>
  </section>
);


const TrackedWrapper = ({ productId, children, className, onClick, isPremium }: { productId: string, children: React.ReactNode, className?: string, onClick?: () => void, isPremium?: boolean }) => {
  const { recordClick } = useActivityLogger(productId, isPremium);
  return (
    <div className={className} onClick={() => { recordClick(); onClick?.(); }}>
      {children}
    </div>
  );
};

const ItemCard = ({ 
  item, 
  onSelect, 
  isSelected,
  onConfirm,
  onUpdateCategory,
  onDelete,
  isPremium
}: { 
  item: WardrobeItem | CatalogItem, 
  onSelect?: () => void, 
  isSelected?: boolean,
  onConfirm?: (id: string) => void,
  onUpdateCategory?: (id: string, category: Category) => void,
  onDelete?: (id: string) => void,
  isPremium?: boolean,
  key?: React.Key
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { recordClick } = useActivityLogger(item.id, isPremium);

  const confidence = 'confidence' in item ? item.confidence : 1;
  const isConfirmed = 'isConfirmed' in item ? item.isConfirmed : true;

  const handleClick = (e: React.MouseEvent) => {
    recordClick({ context: 'card_click' });
    onSelect?.();
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onClick={handleClick}
      className={`relative group rounded-2xl overflow-hidden bg-white border transition-all cursor-pointer ${isSelected ? 'border-accent ring-2 ring-accent/20' : 'border-cool-gray/10'} ${!isConfirmed ? 'border-amber-400/50' : ''}`}
    >
      <div className="aspect-[3/4] overflow-hidden relative">
        <img 
          src={item.imageUrl} 
          alt={item.category} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        {!isConfirmed && (
          <div className="absolute top-2 left-2 z-20 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
            <Info className="w-2 h-2" />
            LOW CONFIDENCE ({Math.round(confidence * 100)}%)
          </div>
        )}
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="absolute top-2 right-2 z-20 p-2 bg-white/95 backdrop-blur-sm rounded-xl text-cool-gray hover:text-red-500 transition-all shadow-lg border border-cool-gray/10"
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          {isEditing ? (
            <select 
              className="text-[10px] font-bold text-accent uppercase tracking-wider bg-accent/5 border border-accent/20 rounded px-1 outline-none"
              value={item.category}
              onChange={(e) => {
                onUpdateCategory?.(item.id, e.target.value as Category);
                setIsEditing(false);
              }}
              onBlur={() => setIsEditing(false)}
              autoFocus
            >
              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">{item.category}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }} 
                className="p-1 rounded-md bg-cool-gray/5 hover:bg-cool-gray/10 transition-all flex items-center gap-1"
                title="Edit Category"
              >
                <Settings className="w-3 h-3 text-cool-gray hover:text-accent" />
                <span className="text-[8px] font-bold text-cool-gray uppercase">Edit</span>
              </button>
            </div>
          )}
          {'price' in item && <span className="text-sm font-semibold text-navy">${item.price}</span>}
        </div>
        <h3 className="font-medium text-sm text-navy mb-2 truncate">
          {'brand' in item ? item.brand : item.color} {item.category}
        </h3>
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-cool-gray/5 border border-cool-gray/10 rounded text-[10px] text-cool-gray">{item.season}</span>
          <span className="px-2 py-0.5 bg-cool-gray/5 border border-cool-gray/10 rounded text-[10px] text-cool-gray">{item.formality}</span>
        </div>
        {!isConfirmed && onConfirm && (
          <button 
            onClick={() => onConfirm(item.id)}
            className="w-full mt-3 py-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            CONFIRM CATEGORY
          </button>
        )}
      </div>
      {onSelect && isConfirmed && (
        <button 
          onClick={onSelect}
          className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-cool-gray/5 flex items-center justify-center transition-opacity"
        >
          <div className="bg-white p-2 rounded-full shadow-lg">
            {isSelected ? <CheckCircle2 className="w-6 h-6 text-accent" /> : <Plus className="w-6 h-6 text-navy" />}
          </div>
        </button>
      )}
    </motion.div>
  );
};


const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQuantity,
  onCheckout
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  items: CartItem[], 
  onRemove: (id: string) => void,
  onUpdateQuantity: (id: string, q: number) => void,
  onCheckout: () => void
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[101] shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-cool-gray/10 flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-navy">Your Cart</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-cool-gray/10 transition-colors">
              <X className="w-5 h-5 text-navy" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-cool-gray space-y-4">
                <ShoppingBag className="w-12 h-12 opacity-20" />
                <p className="font-medium">Your cart is empty</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-cool-gray/5 flex-shrink-0">
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h3 className="font-medium text-sm text-navy">{item.brand} {item.category}</h3>
                      <button onClick={() => onRemove(item.id)} className="text-cool-gray hover:text-accent">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-cool-gray">${item.price}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 rounded-full border border-cool-gray/10 flex items-center justify-center text-cool-gray hover:bg-cool-gray/5"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium text-navy">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full border border-cool-gray/10 flex items-center justify-center text-cool-gray hover:bg-cool-gray/5"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className="p-6 border-t border-cool-gray/10 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-cool-gray text-sm">Total</span>
                <span className="text-2xl font-display font-bold text-navy">
                  ${items.reduce((acc, item) => acc + (item.price * item.quantity), 0)}
                </span>
              </div>
              <button 
                onClick={onCheckout}
                className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-lg"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Checkout = ({ items, onBack }: { items: CartItem[], onBack: () => void }) => {
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  return (
    <section className="py-20 px-6 max-w-4xl mx-auto space-y-12">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-cool-gray/10 transition-colors">
          <ChevronRight className="w-5 h-5 rotate-180 text-navy" />
        </button>
        <h2 className="text-4xl font-display font-bold text-navy">Checkout</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-navy">Shipping Information</h3>
            <div className="grid gap-4">
              <input type="text" placeholder="Full Name" className="w-full p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 focus:outline-none focus:ring-2 focus:ring-accent/20 text-navy" />
              <input type="email" placeholder="Email Address" className="w-full p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 focus:outline-none focus:ring-2 focus:ring-accent/20 text-navy" />
              <input type="text" placeholder="Address" className="w-full p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 focus:outline-none focus:ring-2 focus:ring-accent/20 text-navy" />
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="City" className="p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 focus:outline-none focus:ring-2 focus:ring-accent/20 text-navy" />
                <input type="text" placeholder="Zip Code" className="p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 focus:outline-none focus:ring-2 focus:ring-accent/20 text-navy" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-navy">Payment Method</h3>
            <div className="grid gap-4">
              <div className="p-4 rounded-2xl border-2 border-accent bg-accent/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-navy rounded flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold italic">VISA</span>
                  </div>
                  <span className="text-sm font-medium text-navy">•••• •••• •••• 4242</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <button className="p-4 rounded-2xl border border-cool-gray/10 bg-cool-gray/5 text-sm font-medium text-cool-gray hover:bg-cool-gray/10 transition-all">
                + Add New Payment Method
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 rounded-[32px] bg-cool-gray/5 border border-cool-gray/10 h-fit space-y-6">
          <h3 className="text-lg font-bold text-navy">Order Summary</h3>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-cool-gray">{item.brand} {item.category} x {item.quantity}</span>
                <span className="font-medium text-navy">${item.price * item.quantity}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-cool-gray/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-cool-gray">Subtotal</span>
                <span className="text-navy">${total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cool-gray">Shipping</span>
                <span className="text-accent font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-xl font-display font-bold pt-2 text-navy">
                <span>Total</span>
                <span>${total}</span>
              </div>
            </div>
          </div>
          <button className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-lg">
            Complete Purchase
          </button>
        </div>
      </div>
    </section>
  );
};


const Pricing = ({ 
  currentTier, 
  onSelectTier 
}: { 
  currentTier: SubscriptionTier, 
  onSelectTier: (tier: SubscriptionTier) => void 
}) => {
  const tiers = [
    {
      name: SubscriptionTier.BASIC,
      price: "$0",
      features: ["Up to 10 wardrobe items", "Basic styling analysis", "Standard recommendations"],
      cta: "Current Plan",
      accent: false
    },
    {
      name: SubscriptionTier.PRO,
      price: "$9.99",
      features: ["NLP stylist", "improved ranking", "Up to 50 wardrobe items"],
      cta: "Upgrade to Pro",
      accent: true
    },
    {
      name: SubscriptionTier.PREMIUM,
      price: "$24.99",
      features: ["behavioral tracking", "personalization", "triggers + email insights", "Unlimited items"],
      cta: "Go Premium",
      accent: false
    }
  ];

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-display font-bold text-navy">Choose Your Style Journey</h2>
        <p className="text-cool-gray max-w-xl mx-auto">Unlock advanced AI features and personalized styling insights with our premium plans.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map(tier => (
          <div 
            key={tier.name}
            className={`p-8 rounded-[32px] border transition-all ${tier.accent ? 'border-accent bg-accent/5 ring-4 ring-accent/10' : 'border-cool-gray/10 bg-white'}`}
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-display font-bold text-navy">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-navy">{tier.price}</span>
                  <span className="text-cool-gray text-sm">/month</span>
                </div>
              </div>
              <ul className="space-y-4">
                {tier.features.map(f => (
                  <li key={f} className="flex items-start gap-3 text-sm text-cool-gray">
                    <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => onSelectTier(tier.name)}
                disabled={currentTier === tier.name}
                className={`w-full py-4 rounded-2xl font-bold transition-all ${tier.accent ? 'bg-accent text-white hover:bg-accent/90' : 'bg-navy text-white hover:bg-navy/90'} ${currentTier === tier.name ? 'opacity-50 cursor-default' : ''}`}
              >
                {currentTier === tier.name ? 'Current Plan' : tier.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

};

const Dashboard = ({ wardrobe, analysis, tier, isFeatureEnabled, setCurrentView }: { wardrobe: WardrobeItem[], analysis: WardrobeAnalysis | null, tier: SubscriptionTier, isFeatureEnabled: (t: SubscriptionTier) => boolean, setCurrentView: (v: string) => void }) => {
  const statsTotal = analysis ? Object.values(analysis.colorBalance).reduce((a, b) => (a as number) + (b as number), 0) as number : 0;
  const showStats = analysis ? (analysis.averageConfidence >= 0.65 || analysis.confirmedItems === analysis.totalItems) : false;

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-display font-bold mb-2 text-navy">Wardrobe Insights</h2>
          <p className="text-cool-gray">Deep dive into your personal style data.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none px-6 py-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 text-center">
            <p className="text-[10px] font-bold text-cool-gray uppercase tracking-widest">Total Items</p>
            <p className="text-2xl font-display font-bold text-navy">{wardrobe.length}</p>
          </div>
          <div className="flex-1 md:flex-none px-6 py-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 text-center">
            <p className="text-[10px] font-bold text-cool-gray uppercase tracking-widest">AI Accuracy</p>
            <p className="text-2xl font-display font-bold text-accent">{analysis ? Math.round(analysis.averageConfidence * 100) : 0}%</p>
          </div>
        </div>
      </div>

      {!showStats && analysis && analysis.totalItems > 0 && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900">Verification Required</h4>
            <p className="text-sm text-amber-800">Some items have low detection confidence. Please confirm categories in your wardrobe to unlock full insights.</p>
          </div>
        </div>
      )}

      {/* Premium Behavioral & Personalization Section */}
      {isFeatureEnabled(SubscriptionTier.PREMIUM) ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="p-8 rounded-[40px] bg-white border border-cool-gray/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center">
                <Palette className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-bold text-lg text-navy">Personalized Style Persona</h3>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-cool-gray leading-relaxed">
                Based on your interaction with the catalog and your wardrobe composition, Aura has identified your style persona as:
              </p>
              <div className="p-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10">
                <span className="text-xl font-display font-bold text-navy">Modern Minimalist</span>
                <p className="text-xs text-cool-gray mt-1">You prefer clean lines, neutral tones, and versatile staples.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
                  <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Favored Color</p>
                  <p className="text-sm font-bold text-navy">Navy Blue</p>
                </div>
                <div className="p-3 rounded-xl bg-accent/5 border border-accent/10 text-center">
                  <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Most Viewed</p>
                  <p className="text-sm font-bold text-navy">Outerwear</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-navy text-white space-y-6 fashion-shadow overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display font-bold text-lg">Smart Style Alarms</h3>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Sun className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Weather Alert</h4>
                  <p className="text-xs text-white/60">It's getting colder. Your {wardrobe.find(i => i.category === Category.OUTERWEAR)?.color || 'favorite'} coat has been missing for 3 weeks - time to pull it out?</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 opacity-50 grayscale">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Briefcase className="w-4 h-4 text-white/40" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Upcoming: Work Event</h4>
                  <p className="text-xs text-white/60">Aura suggests checking your Formal shoes for an upcoming calendar event.</p>
                </div>
              </div>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center">Email Insights Sent Weekly</p>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-12 rounded-[40px] bg-cool-gray/5 border-2 border-dashed border-cool-gray/10 text-center space-y-4">
          <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-cool-gray/40" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-display font-bold text-navy">Unlock Premium Insights</h3>
            <p className="text-sm text-cool-gray max-w-sm mx-auto">Get behavioral tracking, personalized style personas, and smart email notifications.</p>
          </div>
          <button 
            onClick={() => setCurrentView('pricing')}
            className="px-8 py-3 bg-navy text-white rounded-full font-bold text-xs hover:bg-navy/80 transition-all"
          >
            Explore Premium
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Formality Distribution */}
        <div className="p-8 rounded-[32px] bg-white border border-cool-gray/10 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg text-navy">Formality Mix</h3>
          <div className="space-y-4">
            {analysis && Object.entries(analysis.formalityDistribution).map(([formality, count]) => (
              <div key={formality} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-cool-gray">
                  <span>{formality}</span>
                  <span>{showStats ? Math.round((count as number / statsTotal) * 100) : "???"}%</span>
                </div>
                <div className="h-2 bg-cool-gray/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: showStats ? `${(count as number / statsTotal) * 100}%` : "0%" }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonality */}
        <div className="p-8 rounded-[32px] bg-white border border-cool-gray/10 shadow-sm space-y-6">
          <h3 className="font-display font-bold text-lg text-navy">Seasonality</h3>
          <div className="grid grid-cols-2 gap-4">
            {analysis && Object.entries(analysis.seasonSuitability).map(([season, count]) => (
              <div key={season} className="p-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 text-center space-y-1">
                <p className="text-[10px] font-bold text-cool-gray uppercase">{season}</p>
                <p className="text-xl font-display font-bold text-navy">{showStats ? (count as number) : "???"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions Card */}
        <div className="p-8 rounded-[32px] bg-navy text-white space-y-6 fashion-shadow">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            AI Recommendations
          </h3>
          <div className="space-y-4">
            {analysis?.suggestions.map((s, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent text-[10px] font-bold">{i + 1}</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {analysis && analysis.duplicates.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-2xl font-display font-bold text-navy">Potential Duplicates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {analysis.duplicates.map(item => (
              <ItemCard key={item.id} item={item} isPremium={tier === SubscriptionTier.PREMIUM} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};


const Profile = ({ 
  user, 
  wardrobe, 
  savedRecommendations, 
  onUpdateProfile,
  onDeleteWardrobeItem,
  tier,
  onViewChange
}: { 
  user: User, 
  wardrobe: WardrobeItem[], 
  savedRecommendations: SavedRecommendation[],
  onUpdateProfile: (data: Partial<User>) => void,
  onDeleteWardrobeItem: (id: string) => void,
  tier: SubscriptionTier,
  onViewChange: (view: string) => void
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ 
    name: user.name, 
    style: user.preferences?.style || '',
    modestyEnforced: user.preferences?.modestyEnforced || false,
    cultureRules: user.preferences?.cultureRules || ''
  });

  // Sync state when user prop changes
  useEffect(() => {
    setEditData({
      name: user.name,
      style: user.preferences?.style || '',
      modestyEnforced: user.preferences?.modestyEnforced || false,
      cultureRules: user.preferences?.cultureRules || ''
    });
  }, [user]);

  const handleSave = () => {
    onUpdateProfile({ 
      name: editData.name, 
      preferences: { 
        ...user.preferences, 
        style: editData.style,
        modestyEnforced: editData.modestyEnforced,
        cultureRules: editData.cultureRules
      } 
    });
    setIsEditing(false);
  };

  return (
    <section className="py-20 px-6 max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Info */}
        <div className="w-full md:w-1/3 p-8 rounded-[32px] bg-white border border-cool-gray/10 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-display font-bold text-navy">Profile</h3>
            <button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="text-xs font-bold text-accent uppercase tracking-wider hover:underline"
            >
              {isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <UserCircle className="w-12 h-12 text-accent" />
            </div>
            <div className="text-center space-y-1">
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 text-center font-display font-bold text-navy bg-cool-gray/5 rounded-xl border border-cool-gray/10 focus:outline-none"
                />
              ) : (
                <h4 className="text-xl font-display font-bold text-navy">{user.name}</h4>
              )}
              <p className="text-sm text-cool-gray">{user.email}</p>
            </div>
          </div>

          {user.isAdmin && (
            <div className="pt-6 border-t border-cool-gray/10">
              <button 
                onClick={() => onViewChange('retailer-dashboard')}
                className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-accent" />
                Go to Retailer Dashboard
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-cool-gray/10 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-cool-gray">Style Preference</label>
              {isEditing ? (
                <select 
                  value={editData.style}
                  onChange={(e) => setEditData({ ...editData, style: e.target.value })}
                  className="w-full px-3 py-2 text-sm text-navy bg-cool-gray/5 rounded-xl border border-cool-gray/10 focus:outline-none"
                >
                  <option value="">Select Style</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Bohemian">Bohemian</option>
                  <option value="Streetwear">Streetwear</option>
                  <option value="Classic">Classic</option>
                  <option value="Avant-Garde">Avant-Garde</option>
                </select>
              ) : (
                <p className="text-sm text-navy font-medium">{user.preferences?.style || 'Not set'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-cool-gray">Cultural Modesty Rules</label>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="modestyEnforced"
                      checked={editData.modestyEnforced}
                      onChange={(e) => setEditData({ ...editData, modestyEnforced: e.target.checked })}
                      className="w-4 h-4 text-accent border-cool-gray/30 rounded focus:ring-accent"
                    />
                    <label htmlFor="modestyEnforced" className="text-sm font-medium text-navy">Enforce Modesty</label>
                  </div>
                  <textarea 
                    placeholder="Describe specific rules (e.g., No bare shoulders, ankle-length skirts only)"
                    value={editData.cultureRules}
                    onChange={(e) => setEditData({ ...editData, cultureRules: e.target.value })}
                    className="w-full px-3 py-2 text-sm text-navy bg-cool-gray/5 rounded-xl border border-cool-gray/10 focus:outline-none min-h-[80px]"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm text-navy font-medium">{user.preferences?.modestyEnforced ? 'Enforced' : 'Not Enforced'}</p>
                  {user.preferences?.cultureRules && (
                    <p className="text-xs text-cool-gray italic leading-relaxed">{user.preferences.cultureRules}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Saved Items & Recs */}
        <div className="w-full md:w-2/3 space-y-8">
          <div className="space-y-6">
            <h3 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
              <Layers className="w-6 h-6 text-accent" />
              Your Wardrobe ({wardrobe.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {wardrobe.map(item => (
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  onDelete={onDeleteWardrobeItem}
                  isPremium={tier === SubscriptionTier.PREMIUM}
                />
              ))}
              {wardrobe.length === 0 && (
                <div className="col-span-full py-12 text-center border-2 border-dashed border-cool-gray/10 rounded-[32px]">
                  <p className="text-cool-gray text-sm">No items saved yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-display font-bold text-navy flex items-center gap-2">
              <Heart className="w-6 h-6 text-accent" />
              Saved Recommendations
            </h3>
            <div className="space-y-4">
              {savedRecommendations.map(rec => (
                <div key={rec.id} className="p-6 rounded-[32px] bg-white border border-cool-gray/10 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-navy">{rec.title}</h4>
                      <p className="text-xs text-cool-gray">{new Date(rec.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-cool-gray leading-relaxed">{rec.description}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {rec.items.map((item, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-cool-gray/10">
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {savedRecommendations.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-cool-gray/10 rounded-[32px]">
                  <p className="text-cool-gray text-sm">No recommendations saved yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const GiftResults = ({ 
  recommendations, 
  giftConfig, 
  onShare, 
  onBack,
  onClear,
  onAdjust,
  tier
}: { 
  recommendations: CatalogItem[], 
  giftConfig: GiftModeConfig, 
  onShare: (item: CatalogItem) => void, 
  onBack: () => void,
  onClear: () => void,
  onAdjust: () => void,
  tier: SubscriptionTier
}) => {
  return (
    <section className="min-h-screen pt-32 pb-20 px-6 bg-cool-gray/5">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-cool-gray hover:text-navy transition-colors text-[10px] font-bold uppercase tracking-[0.2em]"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              Back to Personal Wardrobe
            </button>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-navy rounded-[20px] flex items-center justify-center shadow-xl shadow-navy/10">
                  <Gift className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent block mb-1">AI Concierge Selection</span>
                  <h2 className="text-5xl font-display font-bold text-navy tracking-tight">Curated for {giftConfig.recipientName || 'Your Recipient'}</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="px-4 py-2 rounded-xl bg-white border border-cool-gray/10 shadow-sm flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cool-gray uppercase tracking-widest">Occasion:</span>
                  <span className="text-[10px] font-bold text-navy uppercase tracking-widest">{giftConfig.occasion}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-cool-gray/10 shadow-sm flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cool-gray uppercase tracking-widest">Budget:</span>
                  <span className="text-[10px] font-bold text-navy uppercase tracking-widest">{giftConfig.budget}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white border border-cool-gray/10 shadow-sm flex items-center gap-2">
                  <span className="text-[10px] font-bold text-cool-gray uppercase tracking-widest">Type:</span>
                  <span className="text-[10px] font-bold text-navy uppercase tracking-widest">{giftConfig.recipientType}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={onAdjust}
               className="px-6 py-3 rounded-2xl bg-white border border-cool-gray/10 text-navy hover:border-accent transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
             >
               <Settings className="w-3.5 h-3.5" />
               Adjust Preferences
             </button>
             <button 
               onClick={onClear}
               className="px-6 py-3 rounded-2xl bg-white border border-cool-gray/10 text-cool-gray hover:text-red-500 transition-all text-xs font-bold uppercase tracking-wider"
             >
               Exit Gift Mode
             </button>
             <div className="px-6 py-3 rounded-2xl bg-white border border-cool-gray/10 shadow-sm flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs font-bold text-navy uppercase tracking-wider">AI Analysis Complete</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {recommendations.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-[40px] overflow-hidden border border-cool-gray/10 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full"
            >
              <TrackedWrapper productId={item.id} className="contents" isPremium={tier === SubscriptionTier.PREMIUM}>
                <div className="aspect-[3/4] overflow-hidden relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.category} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-bold text-navy uppercase tracking-widest shadow-sm">
                  {item.brand}
                </div>
                <div className="absolute top-4 right-4 bg-accent text-white px-4 py-2 rounded-2xl text-[10px] font-bold shadow-lg">
                  ${item.price}
                </div>
                
                <div className="absolute inset-0 bg-navy/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <button 
                     onClick={() => onShare(item)}
                     className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-navy hover:bg-accent hover:text-white transition-all shadow-xl"
                   >
                     <Share2 className="w-6 h-6" />
                   </button>
                </div>
              </div>
              
              <div className="p-8 space-y-4 flex-1 flex flex-col">
                <div>
                  <h4 className="text-lg font-bold text-navy">{item.category}</h4>
                  <p className="text-xs text-cool-gray font-medium uppercase tracking-wider">{item.formality} • {item.season}</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 flex-1">
                  <p className="text-[11px] text-cool-gray leading-relaxed italic">
                    "{item.reasoning || 'A versatile and timeless piece that perfectly matches the occasion.'}"
                  </p>
                </div>
                
                <button 
                  onClick={() => {
                    trackActivity({ product_id: item.id, activity_type: 'click', metadata: { action: 'share_gift' } });
                    onShare(item);
                  }}
                  className="w-full py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all flex items-center justify-center gap-3 group/btn"
                >
                  Share Gift Idea
                  <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </button>
              </div>
            </TrackedWrapper>
          </motion.div>
          ))}
        </div>
        
        {recommendations.length === 0 && (
          <div className="py-20 text-center space-y-6 bg-white rounded-[40px] border-2 border-dashed border-cool-gray/10">
            <div className="w-20 h-20 bg-cool-gray/5 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-cool-gray/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-navy">No matches found</h3>
              <p className="text-cool-gray max-w-xs mx-auto">Try adjusting your gift preferences or budget to see more options.</p>
            </div>
            <button 
              onClick={onAdjust}
              className="px-8 py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all"
            >
              Adjust Preferences
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Scoring Helpers ---

const getMissingCategories = (category: Category): Category[] => {
  switch (category) {
    case Category.TOP: return [Category.BOTTOM, Category.SHOES];
    case Category.BOTTOM: return [Category.TOP, Category.SHOES];
    case Category.OUTERWEAR: return [Category.BOTTOM, Category.TOP];
    case Category.DRESS: return [Category.SHOES, Category.OUTERWEAR];
    case Category.SHOES: return [Category.TOP, Category.BOTTOM, Category.DRESS];
    case Category.ACCESSORY: return [Category.TOP, Category.DRESS];
    default: return [Category.TOP, Category.BOTTOM];
  }
};

const NEUTRAL_COLORS = ["Black", "White", "Beige", "Gray", "Tan", "Cream", "Navy"];

const COLOR_COMPATIBILITY: Record<string, string[]> = {
  "Blue": ["Green", "Emerald", "Purple", "Navy", "White", "Beige"],
  "Navy": ["White", "Beige", "Red", "Yellow", "Gold", "Gray"],
  "Emerald": ["Gold", "Navy", "Black", "White", "Cream"],
  "Red": ["Pink", "Navy", "Gray", "Black", "White"],
  "Gold": ["Black", "Emerald", "Navy", "White", "Red"],
  "Pink": ["Red", "White", "Gray", "Navy"],
  "Yellow": ["Navy", "Gray", "White", "Purple"],
  "Purple": ["Yellow", "White", "Gray", "Navy"],
};

const getFormalityLevel = (f: Formality | string): number => {
  const norm = String(f).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (norm === "casual") return 0;
  if (norm === "smartcasual") return 1;
  if (norm === "business") return 2;
  if (norm === "formal") return 3;
  return 0;
};

const calculateMatchScore = (
  item: CatalogItem, 
  contextItem: WardrobeItem | null, 
  filters: StylistFilters,
  parsedQuery: ParsedQuery | null,
  styleSwitchMode: Formality | "Streetwear" | null = null
): number => {
  let score = 0;

  // 1. Strict Filters (Ocassion & Season)
  if (filters.occasion !== "All" && !item.occasions.includes(filters.occasion as Occasion)) score -= 100;
  if (filters.season !== "All" && item.season !== filters.season && item.season !== Season.ALL) score -= 50;
  if (filters.modestyEnforced && item.coverage === "Low") score -= 200;

  // 2. Style Switch Override
  if (styleSwitchMode) {
    if (styleSwitchMode === "Streetwear") {
      // Logic for streetwear: relaxed fits, higher texture, specific categories (Outerwear, Accessories)
      if (item.fit === "Oversized" || item.fit === "Relaxed") score += 100;
      if (["Canvas", "Denim", "Jersey"].includes(item.texture)) score += 50;
      if (item.formality === Formality.CASUAL) score += 50;
    } else {
      const targetStyleFormality = getFormalityLevel(styleSwitchMode as Formality);
      const itemFormality = getFormalityLevel(item.formality);
      const diff = Math.abs(targetStyleFormality - itemFormality);
      if (diff === 0) score += 150;
      else if (diff === 1) score += 75;
      else score -= 50;
    }
  }

  // 3. Query Specific Overrides (Color/Category/Formality/Season/Occasion)
  if (parsedQuery) {
    if (parsedQuery.color && item.color.toLowerCase() === parsedQuery.color.toLowerCase()) score += 100;
    if (parsedQuery.category && item.category.toLowerCase() === parsedQuery.category.toLowerCase()) score += 150;
    if (parsedQuery.formality && item.formality.toLowerCase() === parsedQuery.formality.toLowerCase()) score += 100;
    if (parsedQuery.season) {
      const qSeason = parsedQuery.season.toLowerCase();
      const iSeason = item.season.toLowerCase();
      if (iSeason === qSeason || iSeason.includes("all") || qSeason.includes("all")) score += 100;
    }
    if (parsedQuery.occasion) {
      const qOccasion = parsedQuery.occasion.toLowerCase();
      if (item.occasions.some(o => o.toLowerCase() === qOccasion)) score += 100;
    }
  }

  // 3. Style/Formality Matching
  let targetFormality: number;
  if (parsedQuery?.formality) {
    targetFormality = getFormalityLevel(parsedQuery.formality);
  } else if (filters.formality !== "All") {
    targetFormality = getFormalityLevel(filters.formality as Formality);
  } else {
    targetFormality = contextItem ? getFormalityLevel(contextItem.formality) : 1;
  }
  
  const itemFormality = getFormalityLevel(item.formality);
  const diff = Math.abs(targetFormality - itemFormality);

  if (diff === 0) score += 50;
  else if (diff === 1) score += 25;
  else score -= 30;

  // 4. Color Harmony (if matching against an item)
  if (contextItem) {
    const c1 = contextItem.color;
    const c2 = item.color;

    if (c1 === c2) score += 40; // Monochromatic
    else if (NEUTRAL_COLORS.includes(c1) || NEUTRAL_COLORS.includes(c2)) score += 35; // One is neutral
    else if (COLOR_COMPATIBILITY[c1]?.includes(c2) || COLOR_COMPATIBILITY[c2]?.includes(c1)) score += 30; // Compatible
    else score -= 10; // Potential clash
  } else {
    // General recommendation: prioritize versatile neutrals
    if (NEUTRAL_COLORS.includes(item.color)) score += 20;
  }

  // 5. Category Synergy
  // ... (rest remains similar but we favor synergies)
  if (contextItem) {
    const contextCat = contextItem.category;
    const itemCat = item.category;

    const synergies: Record<Category, Category[]> = {
      [Category.TOP]: [Category.BOTTOM, Category.SHOES, Category.ACCESSORY],
      [Category.BOTTOM]: [Category.TOP, Category.OUTERWEAR, Category.SHOES],
      [Category.OUTERWEAR]: [Category.BOTTOM, Category.TOP, Category.SHOES],
      [Category.DRESS]: [Category.SHOES, Category.ACCESSORY, Category.OUTERWEAR],
      [Category.SHOES]: [Category.TOP, Category.BOTTOM, Category.DRESS],
      [Category.ACCESSORY]: [Category.TOP, Category.DRESS],
    };

    if (synergies[contextCat]?.includes(itemCat)) score += 40;
    if (contextCat === itemCat) score -= 60; // Don't suggest two tops together
  }

  return score;
};

// --- Main App ---

export default function App() {
  const [currentView, setCurrentView] = useState<string>('stylist');
  const [language, setLanguage] = useState<"en" | "es">("en");
  const isEs = language === "es";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [sharingItem, setSharingItem] = useState<CatalogItem | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.BASIC);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const wardrobeRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<StylistFilters>({
    season: "All",
    occasion: "All",
    formality: "All",
    modestyEnforced: false,
  });
  const [recommendations, setRecommendations] = useState<CatalogItem[]>([]);
  const [selectedOutfit, setSelectedOutfit] = useState<WardrobeItem[]>([]);
  const [accessories, setAccessories] = useState<CatalogItem[]>([]);
  const [showGiftMode, setShowGiftMode] = useState(false);
  const [isGiftModeActive, setIsGiftModeActive] = useState(false);
  const [giftConfig, setGiftConfig] = useState<GiftModeConfig>({
    recipientName: "",
    recipientType: "Woman",
    occasion: Occasion.WORK,
    budget: "Mid-range",
    customInstructions: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isSearching) {
      setSearchProgress(5);
      interval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev < 35) {
            // Fast initial surge
            return prev + (Math.random() * 8 + 4);
          } else if (prev < 65) {
            // Smooth moderate speed
            return prev + (Math.random() * 4 + 2);
          } else if (prev < 88) {
            // Slower buildup
            return prev + (Math.random() * 2 + 0.8);
          } else if (prev < 98) {
            // Micro increments as we near response
            return prev + (Math.random() * 0.4 + 0.1);
          } else {
            return prev; // hold at 98-99%
          }
        });
      }, 150);
    } else {
      setSearchProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSearching]);

  const [parsedQuery, setParsedQuery] = useState<ParsedQuery | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // Chat Photo & Voice states
  const [chatUploadedImage, setChatUploadedImage] = useState<string | null>(null);
  const [chatUploadedImageMime, setChatUploadedImageMime] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (subscriptionTier !== SubscriptionTier.PREMIUM) return;
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, subscriptionTier]);
  const [styleSwitchMode, setStyleSwitchMode] = useState<Formality | "Streetwear" | null>(null);
  const [analysis, setAnalysis] = useState<WardrobeAnalysis | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const [lastUploadedItem, setLastUploadedItem] = useState<WardrobeItem | null>(null);
  const [lastUploadedItemScore, setLastUploadedItemScore] = useState<StyleScore | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedRecommendations, setSavedRecommendations] = useState<SavedRecommendation[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingRecs, setIsGeneratingRecs] = useState(false);
  const [stylistAdvice, setStylistAdvice] = useState<string>("");

  const isFeatureEnabled = (tierRequired: SubscriptionTier) => {
    const weights: Record<SubscriptionTier, number> = {
      [SubscriptionTier.BASIC]: 1,
      [SubscriptionTier.PRO]: 2,
      [SubscriptionTier.PREMIUM]: 3,
    };
    return weights[subscriptionTier] >= weights[tierRequired];
  };
  useEffect(() => {
    let wardrobeUnsubscribe: (() => void) | null = null;
    let recommendationsUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Fetch user preferences and admin status from Firestore
        const userRef = doc(db, "users", fbUser.uid);
        const adminRef = doc(db, "admins", fbUser.uid);
        
        try {
          const [userDoc, adminDoc] = await Promise.all([
            getDoc(userRef),
            getDoc(adminRef)
          ]);

          const isAdmin = adminDoc.exists();
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const currentUser: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || userData.name || 'User',
              preferences: userData.preferences,
              createdAt: userData.createdAt?.toDate?.()?.toISOString(),
              updatedAt: userData.updatedAt?.toDate?.()?.toISOString(),
              isAdmin: isAdmin
            };
            setUser(currentUser);
            if (userData.preferences?.modestyEnforced !== undefined) {
               setFilters(prev => ({ ...prev, modestyEnforced: userData.preferences.modestyEnforced }));
            }
          } else {
            setUser({
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || 'User',
              isAdmin: isAdmin
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'User',
            isAdmin: false
          });
        }
        
        // Wardrobe real-time sync
        const wardrobePath = `users/${fbUser.uid}/wardrobe`;
        wardrobeUnsubscribe = onSnapshot(collection(db, wardrobePath), (snapshot) => {
          const items: WardrobeItem[] = [];
          snapshot.forEach((doc) => {
            items.push({ ...doc.data() as WardrobeItem, id: doc.id });
          });
          setWardrobe(items);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, wardrobePath);
        });

        // Recommendations real-time sync
        const recsPath = `users/${fbUser.uid}/saved_recommendations`;
        recommendationsUnsubscribe = onSnapshot(collection(db, recsPath), (snapshot) => {
          const recs: SavedRecommendation[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            recs.push({ 
              ...data as SavedRecommendation, 
              id: doc.id,
              created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
            });
          });
          setSavedRecommendations(recs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, recsPath);
        });

      } else {
        setUser(null);
        setWardrobe([]);
        setSavedRecommendations([]);
        wardrobeUnsubscribe?.();
        recommendationsUnsubscribe?.();
      }
    });

    return () => {
      unsubscribe();
      wardrobeUnsubscribe?.();
      recommendationsUnsubscribe?.();
    };
  }, []);


  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setWardrobe([]);
    setSavedRecommendations([]);
    setCurrentView('stylist');
  };

  const handleUpdateProfile = async (data: Partial<User>) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      setUser(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const deleteWardrobeItem = async (itemId: string) => {
    if (!user) return;
    
    // Optimistically update local state
    setWardrobe(prev => prev.filter(item => item.id !== itemId));
    setSelectedOutfit(prev => prev.filter(item => item.id !== itemId));

    try {
      const itemRef = doc(db, `users/${user.id}/wardrobe`, itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${user.id}/wardrobe/${itemId}`);
    }
  };

  const saveRecommendation = async (title: string, description: string, items: CatalogItem[]) => {
    if (!user) {
      setIsSignInOpen(true);
      return;
    }
      if (user) {
        try {
          const recRef = await addDoc(collection(db, `users/${user.id}/saved_recommendations`), {
            title,
            description,
            items,
            userId: user.id,
            createdAt: serverTimestamp()
          });
          setSavedRecommendations(prev => [{ id: recRef.id, title, description, items, created_at: new Date().toISOString() }, ...prev]);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `users/${user.id}/saved_recommendations`);
        }
      }
  };

  const addToCart = (item: CatalogItem) => {
    trackActivity({ product_id: item.id, activity_type: 'click', metadata: { action: 'add_to_cart' } });
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateCartQuantity = (id: string, q: number) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: q } : i));
  };

  const scrollToWardrobe = () => {
    wardrobeRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsAnalyzing(true);
    setLastUploadedItemScore(null);
    setUploadProgress(0);
    const newItems: WardrobeItem[] = [];

    // Smooth progress simulation
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += 0.5; // Slow increment
      setUploadProgress(Math.min(98, Math.floor(simulatedProgress)));
    }, 100);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        const itemsPromise = new Promise<WardrobeItem[]>((resolve) => {
          reader.onload = async (event) => {
            const base64 = (event.target?.result as string).split(",")[1];
            
            // Duplicate detection by base64 (exact file)
            const isExactDuplicate = wardrobe.some(item => item.imageUrl === event.target?.result);
            if (isExactDuplicate) {
              showNotification("This item already exists in your wardrobe.", "error");
              resolve([]);
              return;
            }

            const aiResults = await analyzeWardrobeItem(base64);
            
            const detectedItems: WardrobeItem[] = aiResults.map(aiData => ({
              id: Math.random().toString(36).substr(2, 9),
              imageUrl: event.target?.result as string,
              category: (aiData.category as Category) || Category.TOP,
              color: aiData.color || "Unknown",
              season: (aiData.season as Season) || Season.ALL,
              formality: (aiData.formality as Formality) || Formality.CASUAL,
              silhouette: aiData.silhouette || "Standard",
              fit: aiData.fit || "Regular",
              coverage: (aiData.coverage as any) || "Medium",
              texture: aiData.texture || "Fabric",
              occasions: (aiData.occasions as Occasion[]) || [Occasion.LOUNGE],
              confidence: aiData.confidence || 0.8,
              isConfirmed: (aiData.confidence || 0) >= 0.65
            }));

            const filteredItems: WardrobeItem[] = [];

            for (const item of detectedItems) {
              // Visual similarity heuristic (same category, color, and silhouette)
              const isSimilar = wardrobe.some(w => 
                w.category === item.category && 
                w.color.toLowerCase() === item.color.toLowerCase() &&
                w.silhouette.toLowerCase() === item.silhouette.toLowerCase()
              );

              if (isSimilar) {
                showNotification(`A similar ${item.color} ${item.category} already exists.`, "info");
                continue;
              }

              if (user) {
                try {
                  const itemData = {
                    ...item,
                    userId: user.id,
                    createdAt: serverTimestamp()
                  };
                  delete (itemData as any).id; // Let Firestore generate ID

                  const itemRef = await addDoc(collection(db, `users/${user.id}/wardrobe`), itemData);
                  item.id = itemRef.id;
                } catch (error) {
                  handleFirestoreError(error, OperationType.CREATE, `users/${user.id}/wardrobe`);
                }
              }
              filteredItems.push(item);
            }

            if (filteredItems.length > 0) {
              showNotification(`Added ${filteredItems.length} item${filteredItems.length > 1 ? 's' : ''} to your wardrobe.`, "success");
            }
            resolve(filteredItems);
          };
        });
        
        reader.readAsDataURL(file);
        const results = await itemsPromise;
        newItems.push(...results);
        
        // Update simulated progress to reach at least the milestone for this file
        const milestone = ((i + 1) / files.length) * 100;
        if (simulatedProgress < milestone - 5) {
          simulatedProgress = milestone - 5;
        }
      }
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Small delay to show 100% before closing
      setTimeout(async () => {
        setWardrobe(prev => [...prev, ...newItems]);
        if (newItems.length > 0) {
          const mainItem = newItems[newItems.length - 1];
          setLastUploadedItem(mainItem);
          try {
            const score = await getStyleScore(mainItem, wardrobe);
            setLastUploadedItemScore(score);
          } catch (e) {
            console.error("Failed to get style score:", e);
          }
        }
        setIsAnalyzing(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const confirmWardrobeItem = async (id: string) => {
    setWardrobe(prev => prev.map(item => 
      item.id === id ? { ...item, isConfirmed: true } : item
    ));
    if (!user) return;
    try {
      const itemRef = doc(db, `users/${user.id}/wardrobe`, id);
      await updateDoc(itemRef, { isConfirmed: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}/wardrobe/${id}`);
    }
  };

  const updateWardrobeItemCategory = async (id: string, category: Category) => {
    setWardrobe(prev => prev.map(item => 
      item.id === id ? { ...item, category, isConfirmed: true } : item
    ));
    if (!user) return;
    try {
      const itemRef = doc(db, `users/${user.id}/wardrobe`, id);
      await updateDoc(itemRef, { category, isConfirmed: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}/wardrobe/${id}`);
    }
  };

  useEffect(() => {
    if (wardrobe.length > 0) {
      const categories = wardrobe.map(i => i.category);
      const missing = Object.values(Category).filter(c => !categories.includes(c));
      
      // Duplicate detection (simple color + category match)
      const duplicates: WardrobeItem[] = [];
      const seen = new Set<string>();
      wardrobe.forEach(item => {
        const key = `${item.category}-${item.color.toLowerCase()}`;
        if (seen.has(key)) {
          duplicates.push(item);
        } else {
          seen.add(key);
        }
      });

      // Missing essentials
      const essentials = ["White T-shirt", "Black Blazer", "Blue Jeans", "White Sneakers", "Little Black Dress"];
      const missingEssentials = essentials.filter(e => {
        const lowerE = e.toLowerCase();
        return !wardrobe.some(item => 
          item.category.toLowerCase().includes(lowerE.split(' ')[1]?.toLowerCase() || '') ||
          item.silhouette.toLowerCase().includes(lowerE.split(' ')[1]?.toLowerCase() || '')
        );
      });

      const totalConfidence = wardrobe.reduce((acc, i) => acc + (i.confidence || 0), 0);
      const averageConfidence = totalConfidence / wardrobe.length;
      const confirmedCount = wardrobe.filter(i => i.isConfirmed).length;

      // Only include confirmed items in stats if overall confidence is low
      const statsItems = averageConfidence >= 0.65 ? wardrobe : wardrobe.filter(i => i.isConfirmed);

      setAnalysis({
        missingCategories: missing,
        colorBalance: statsItems.reduce((acc, i) => ({ ...acc, [i.color]: (acc[i.color] || 0) + 1 }), {}),
        seasonSuitability: statsItems.reduce((acc, i) => ({ ...acc, [i.season]: (acc[i.season] || 0) + 1 }), {} as any),
        formalityDistribution: statsItems.reduce((acc, i) => ({ ...acc, [i.formality]: (acc[i.formality] || 0) + 1 }), {} as any),
        totalItems: wardrobe.length,
        confirmedItems: confirmedCount,
        averageConfidence,
        duplicates,
        missingEssentials,
        suggestions: [
          missing.length > 0 ? `Your wardrobe is missing ${missing[0]} items.` : "Great variety in your collection!",
          duplicates.length > 0 ? `You have ${duplicates.length} potential duplicate items.` : "Your wardrobe is well-curated with unique pieces.",
          missingEssentials.length > 0 ? `Consider adding a ${missingEssentials[0]} to your collection.` : "You have all the essentials!",
          "You have a strong selection for Casual occasions."
        ]
      });

      // Generate recommendations
      generateRecommendations();
    }
  }, [wardrobe, filters, isGiftModeActive, giftConfig, selectedOutfit, lastUploadedItem, styleSwitchMode]);

  const generateRecommendations = async () => {
    setIsGeneratingRecs(true);
    // Artificial delay for "premium" feel as requested
    await new Promise(resolve => setTimeout(resolve, 800));

    const contextItem = selectedOutfit.length > 0 ? selectedOutfit[0] : lastUploadedItem;

    // Use either explicit filters or parsed query for filtering
    let scored = CATALOG_ITEMS.map(item => ({
      ...item,
      score: calculateMatchScore(item, contextItem, filters, parsedQuery, styleSwitchMode)
    }));

    // Filter out very low scores (strictly excluded)
    let filtered = scored.filter(item => item.score! > -50);

    if (isGiftModeActive) {
      filtered = filtered.filter(item => {
        if (giftConfig.recipientType !== "Unisex" && item.category === Category.DRESS && giftConfig.recipientType === "Man") return false;
        if (giftConfig.occasion !== "Other" && !item.occasions.includes(giftConfig.occasion as Occasion)) return false;
        // Budget filtering
        if (giftConfig.budget === "Value" && item.price > 100) return false;
        if (giftConfig.budget === "Luxury" && item.price < 200) return false;
        return true;
      });
    }

    // Sort by score
    filtered.sort((a, b) => b.score! - a.score!);

    // Add reasoning for top 3
    const langStr = language === "es" ? "Spanish" : "English";
    const [withReasoning, advice] = await Promise.all([
      Promise.all(filtered.slice(0, 3).map(async item => ({
        ...item,
        reasoning: await getRecommendationReasoning(wardrobe, item, filters, contextItem, langStr)
      }))),
      getStylistAdvice(wardrobe, filters, contextItem, parsedQuery, styleSwitchMode, langStr)
    ]);

    setRecommendations([...withReasoning, ...filtered.slice(3)]);
    setStylistAdvice(advice);
    setIsGeneratingRecs(false);
  };

  const toggleOutfitItem = (item: WardrobeItem) => {
    setSelectedOutfit(prev => 
      prev.find(i => i.id === item.id) 
        ? prev.filter(i => i.id !== item.id) 
        : [...prev, item]
    );
  };

  useEffect(() => {
    if (selectedOutfit.length > 0) {
      setAccessories(ACCESSORIES.slice(0, 2));
    } else {
      setAccessories([]);
    }
  }, [selectedOutfit]);

  // Voice and Image upload helpers
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      showNotification(
        isEs ? "La síntesis de voz no está soportada en tu navegador." : "Speech synthesis is not supported on your browser.",
        "error"
      );
      return;
    }
    window.speechSynthesis.cancel();
    
    // Clean text of markdown stars and hashes for clean TTS
    const cleanText = text
      .replace(/[*#`_\-]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "es" ? "es-ES" : "en-US";
    utterance.onstart = () => setCurrentlySpeakingText(text);
    utterance.onend = () => setCurrentlySpeakingText(null);
    utterance.onerror = () => setCurrentlySpeakingText(null);
    
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingText(null);
  };

  const toggleListening = () => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
    if (!SpeechRecognitionAPI) {
      showNotification(
        isEs 
          ? "El reconocimiento de voz no está soportado en tu navegador (prueba Google Chrome)." 
          : "Speech recognition is not supported in your browser (try Google Chrome).", 
        "error"
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "es" ? "es-ES" : "en-US";

      rec.onstart = () => {
        setIsListening(true);
        showNotification(
          isEs ? "Aura está escuchando... ¡Adelante!" : "Aura is listening... Go ahead!", 
          "info"
        );
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(prev => {
            const separator = prev.trim() ? " " : "";
            return prev + separator + transcript;
          });
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
        const errType = e.error || "unknown";
        
        // "aborted" is standard behavior when manually stopping recognition or browser interrupting. Do not error out.
        if (errType === "aborted") {
          return;
        }
        
        if (errType === "not-allowed" || errType === "permission-blocked") {
          showNotification(
            isEs 
              ? "Permiso de micrófono denegado. ¡Intenta hacer clic en el botón 'Open in New Tab' en la esquina superior derecha para conceder permisos!" 
              : "Microphone permission was denied. Try clicking the 'Open in New Tab' button at the top right to grant permissions safely!", 
            "error"
          );
        } else if (errType === "no-speech") {
          showNotification(
            isEs ? "No se detectó voz. Por favor, intenta hablar de nuevo." : "No speech was detected. Please try speaking again.", 
            "info"
          );
        } else if (errType === "audio-capture") {
          showNotification(
            isEs ? "Falló la captura del micrófono. No se encontró micrófono o ya está en uso." : "Microphone capture failed. No microphone found or it is already in use.", 
            "error"
          );
        } else {
          showNotification(
            isEs 
              ? `Error de reconocimiento de voz: ${errType}. ¡Abrir la aplicación en una pestaña nueva suele solucionar las limitaciones de permisos!` 
              : `Speech recognition error: ${errType}. Opening the dev app in a new tab often fixes browser/iframe permission limits!`, 
            "error"
          );
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showNotification("Please select an image file.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setChatUploadedImage(compressedDataUrl);
          setChatUploadedImageMime("image/jpeg");
          showNotification("Photo attached & optimized successfully!", "success");
        } else {
          setChatUploadedImage(reader.result as string);
          setChatUploadedImageMime(file.type);
          showNotification("Photo attached successfully!", "success");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && !chatUploadedImage) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: searchQuery.trim() || "Analyze this uploaded picture for me.",
      timestamp: Date.now()
    };

    if (chatUploadedImage) {
      userMsg.imageData = chatUploadedImage;
      userMsg.imageMimeType = chatUploadedImageMime || "image/jpeg";
    }

    setChatHistory(prev => [...prev, userMsg]);
    setSearchQuery("");
    
    // Clear pending image attachment once sent
    const tempImage = chatUploadedImage;
    const tempMime = chatUploadedImageMime;
    setChatUploadedImage(null);
    setChatUploadedImageMime(null);
    setIsSearching(true);

    try {
      // Keep only last 6 messages for context to keep it fast
      // Include image data inside the current userMsg for proper multimodal interpretation on back-end
      const contextHistory = [...chatHistory, {
        ...userMsg,
        imageData: tempImage || undefined,
        imageMimeType: tempMime || undefined
      }].map(m => ({
        role: m.role,
        content: m.content,
        imageData: m.imageData,
        imageMimeType: m.imageMimeType
      })).slice(-6);
      
      const langStr = language === "es" ? "Spanish" : "English";
      const response = await chatWithStylist(
        contextHistory,
        wardrobe,
        filters,
        langStr
      );

      // Resolve suggested catalog items
      let suggestedItems: CatalogItem[] = [];
      if (response.suggestedItemIds && Array.isArray(response.suggestedItemIds)) {
        const allAvailable = [...CATALOG_ITEMS, ...ACCESSORIES];
        suggestedItems = allAvailable.filter(item => response.suggestedItemIds!.includes(item.id));
      }

      // Fallback: If no explicit IDs, but we have a parsedQuery, find matching products to keep it highly visual
      if (suggestedItems.length === 0 && response.parsedQuery) {
        const query = response.parsedQuery;
        const allAvailable = [...CATALOG_ITEMS, ...ACCESSORIES];
        suggestedItems = allAvailable.filter(item => {
          let score = 0;
          if (query.category && item.category.toLowerCase() === query.category.toLowerCase()) score += 10;
          if (query.color && item.color.toLowerCase() === query.color.toLowerCase()) score += 5;
          if (query.occasion && item.occasions.some(o => o.toLowerCase() === query.occasion!.toLowerCase())) score += 3;
          if (query.formality && item.formality.toLowerCase() === query.formality.toLowerCase()) score += 2;
          return score >= 10;
        }).slice(0, 2);
      }

      const aiMsg: ChatMessage = {
        role: "model",
        content: response.message,
        timestamp: Date.now(),
        suggestedItems: suggestedItems.length > 0 ? suggestedItems : undefined
      };

      setChatHistory(prev => [...prev, aiMsg]);
      
      // Auto speak response if toggled active
      if (autoSpeak) {
        speakText(response.message);
      }
      
      if (response.parsedQuery) {
        setParsedQuery(response.parsedQuery);
        showNotification(`Applying filters: ${response.parsedQuery.color || ""} ${response.parsedQuery.category || ""}`, "info");
      }
    } catch (error) {
      console.error("Chat failed:", error);
      showNotification("Oops, I lost my connection to the fashion world for a second.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, [parsedQuery]);

  return (
    <div className="min-h-screen pb-20">
      <Header 
        onViewChange={setCurrentView} 
        currentView={currentView} 
        cartCount={cart.reduce((acc, i) => acc + i.quantity, 0)}
        onCartOpen={() => setIsCartOpen(true)}
        onSignInOpen={() => setIsSignInOpen(true)}
        tier={subscriptionTier}
        user={user}
        onLogout={handleLogout}
        isGiftModeActive={isGiftModeActive}
        language={language}
        setLanguage={setLanguage}
      />
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        items={cart}
        onRemove={removeFromCart}
        onUpdateQuantity={updateCartQuantity}
        onCheckout={() => {
          setIsCartOpen(false);
          setCurrentView('checkout');
        }}
      />

      <SignInModal 
        isOpen={isSignInOpen} 
        onClose={() => setIsSignInOpen(false)} 
      />

      <AnimatePresence mode="wait">
        {currentView === 'retailer-dashboard' && (
          <motion.div
            key="retailer-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="pt-24 pb-20"
          >
            <RetailerDashboard />
          </motion.div>
        )}

        {currentView === 'stylist' && (
          <motion.div
            key="stylist"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Hero 
              onGetStarted={scrollToWardrobe} 
              onViewDashboard={() => setCurrentView('retailer-dashboard')}
              isAdmin={user?.isAdmin}
            />

            <main className="max-w-7xl mx-auto px-6 space-y-24">
              
              {/* Stylist Chat & Search */}
              {isFeatureEnabled(SubscriptionTier.PRO) ? (
                <section className="relative -mt-12 z-20 space-y-4">
                  {chatHistory.length > 0 && (
                    <div className="max-w-3xl mx-auto space-y-4 max-h-[500px] overflow-y-auto p-6 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/20 fashion-shadow-sm no-scrollbar">
                      {chatHistory.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] p-4 rounded-[20px] text-sm font-medium leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-navy text-white rounded-tr-none shadow-lg fashion-shadow' 
                              : 'bg-white/90 text-navy rounded-tl-none border border-cool-gray/10 shadow-sm'
                          }`}>
                            {msg.imageData && (
                              <div className="mb-2 max-w-[200px] rounded-lg overflow-hidden border border-white/10 shadow-sm bg-black/5">
                                <img 
                                  src={msg.imageData} 
                                  alt="Styling upload" 
                                  className="w-full h-auto object-cover max-h-[160px]"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div>{msg.content}</div>

                            {msg.role === 'model' && (
                              <div className="mt-2.5 flex items-center justify-between text-[10px] text-cool-gray/60 border-t border-cool-gray/5 pt-1.5 gap-2">
                                <button
                                  type="button"
                                  onClick={() => currentlySpeakingText === msg.content ? stopSpeaking() : speakText(msg.content)}
                                  className="flex items-center gap-1.5 hover:text-accent font-semibold transition-colors cursor-pointer"
                                >
                                  {currentlySpeakingText === msg.content ? (
                                    <>
                                      <VolumeX className="w-3.5 h-3.5 antialiased animate-pulse text-accent" />
                                      <span>Stop Speaking</span>
                                    </>
                                  ) : (
                                    <>
                                      <Volume2 className="w-3.5 h-3.5 antialiased hover:text-accent" />
                                      <span>Listen</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                            
                            {msg.role === 'model' && msg.suggestedItems && msg.suggestedItems.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-[220px] sm:min-w-[420px]">
                                {msg.suggestedItems.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="bg-white rounded-2xl overflow-hidden border border-cool-gray/10 shadow-sm hover:shadow-md transition-all flex flex-col group p-1.5"
                                  >
                                    <div className="aspect-[4/3] rounded-xl overflow-hidden relative bg-cool-gray/5">
                                      <img 
                                        src={item.imageUrl} 
                                        alt={`${item.brand} ${item.category}`} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="absolute bottom-1.5 right-1.5 bg-navy/80 backdrop-blur-sm text-[8px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                        ${item.price}
                                      </div>
                                    </div>
                                    <div className="p-2 flex-1 flex flex-col justify-between">
                                      <div>
                                        <h4 className="text-[11px] font-extrabold text-navy truncate leading-tight">{item.brand}</h4>
                                        <p className="text-[9px] text-cool-gray font-medium mt-0.5">{item.color} {item.category}</p>
                                      </div>
                                      <div className="mt-2 text-left flex gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(item);
                                          }}
                                          className="flex-1 py-1 px-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg text-[9px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                                        >
                                          <Plus className="w-2.5 h-2.5" /> Add to Cart
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(item.purchaseUrl, '_blank');
                                          }}
                                          className="p-1.5 bg-cool-gray/5 hover:bg-cool-gray/10 border border-cool-gray/10 rounded-lg text-navy transition-all cursor-pointer flex items-center justify-center"
                                          title="View original link"
                                        >
                                          <ShoppingBag className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      {isSearching && (
                         <motion.div
                           initial={{ opacity: 0, y: 8 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex justify-start w-full max-w-xs"
                         >
                           <div className="bg-white/95 p-4 rounded-[22px] rounded-tl-none border border-cool-gray/10 shadow-sm w-full space-y-2.5">
                             <div className="flex items-center justify-between gap-4">
                               <div className="flex items-center gap-2">
                                 <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                 <span className="text-xs font-bold uppercase tracking-widest text-cool-gray">
                                   {isEs ? "Aura está pensando..." : "Aura is thinking..."}
                                 </span>
                               </div>
                               <span className="text-xs font-mono font-bold text-accent">
                                 {Math.min(99, Math.floor(searchProgress))}%
                               </span>
                             </div>
                             
                             {/* Loading Progress Bar */}
                             <div className="w-full h-1.5 bg-cool-gray/10 rounded-full overflow-hidden">
                               <motion.div 
                                 className="h-full bg-accent rounded-full"
                                 animate={{ width: `${Math.min(100, searchProgress)}%` }}
                                 transition={{ ease: "easeOut", duration: 0.15 }}
                               />
                             </div>
                           </div>
                         </motion.div>
                      )}
                      <div ref={chatBottomRef} />
                    </div>
                  )}

                  {chatUploadedImage && (
                    <div className="max-w-3xl mx-auto p-3 mb-2 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-between border border-white/40 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img 
                          src={chatUploadedImage} 
                          alt="Attachment preview" 
                          className="w-12 h-12 object-cover rounded-lg border border-cool-gray/10" 
                        />
                        <div>
                          <p className="text-xs font-bold text-navy">{isEs ? "Foto Adjunta" : "Photo Attached"}</p>
                          <p className="text-[10px] text-cool-gray">
                            {isEs ? "Aura analizará esta prenda en tu chat de estilo." : "Aura will analyze this item in your styling chat."}
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setChatUploadedImage(null);
                          setChatUploadedImageMime(null);
                        }}
                        className="p-1.5 hover:bg-cool-gray/10 text-cool-gray hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-3 p-2 bg-white/85 backdrop-blur-xl rounded-[32px] fashion-shadow border border-white/20 items-center">
                    {/* Upload Photo Button */}
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="chat-image-input" 
                        onChange={handleChatImageUpload} 
                        className="hidden" 
                      />
                      <label 
                        htmlFor="chat-image-input"
                        className="p-3.5 bg-cool-gray/5 hover:bg-cool-gray/10 border border-cool-gray/10 rounded-[20px] text-navy transition-all cursor-pointer flex items-center justify-center relative hover:scale-105 active:scale-95"
                        title="Upload Photo for analysis"
                      >
                        <Camera className="w-5 h-5 text-navy" />
                      </label>
                    </div>

                    {/* Microphone Dictate Button */}
                    <button 
                      type="button"
                      onClick={toggleListening}
                      className={`p-3.5 border rounded-[20px] transition-all flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer ${
                        isListening 
                          ? 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse' 
                          : 'bg-cool-gray/5 border-cool-gray/10 text-navy hover:bg-cool-gray/10'
                      }`}
                      title={isListening ? "Stop listening" : "Talk to Aura using voice"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    {/* Auto-Speak Read aloud Toggle */}
                    <button 
                      type="button"
                      onClick={() => {
                        setAutoSpeak(!autoSpeak);
                        if (!autoSpeak) {
                          showNotification("Auto Speak Activated!", "success");
                        } else {
                          stopSpeaking();
                          showNotification("Auto Speak Disabled", "info");
                        }
                      }}
                      className={`p-3.5 border rounded-[20px] transition-all flex items-center justify-center hover:scale-105 active:scale-95 cursor-pointer ${
                        autoSpeak 
                          ? 'bg-accent/15 border-accent/25 text-accent font-bold' 
                          : 'bg-cool-gray/5 border-cool-gray/10 text-cool-gray hover:bg-cool-gray/10'
                      }`}
                      title={autoSpeak ? "Auto Speak is ON" : "Turn Auto Speak ON"}
                    >
                      {autoSpeak ? <Volume2 className="w-5 h-5 text-accent" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    {/* Input Field */}
                    <div className="flex-1 relative group">
                      <input 
                        type="text" 
                        placeholder={isListening 
                          ? (isEs ? "Escuchando..." : "Listening aloud...") 
                          : (isEs ? 'Pregúntale a Aura: "Combina esta foto con mi guardarropa"...' : 'Ask Aura: "Style this photo with my wardrobe"...')
                        } 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-6 py-4 rounded-[20px] bg-cool-gray/5 border-none focus:ring-2 focus:ring-accent/20 text-navy font-medium placeholder:text-cool-gray/50 transition-all outline-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button 
                      disabled={isSearching}
                      type="submit"
                      className="px-6 py-4 bg-navy text-white rounded-[20px] font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 text-accent" />}
                      <span className="hidden sm:inline">{isEs ? "Enviar" : "Send"}</span>
                    </button>
                  </form>

                  {parsedQuery && (
                    <div className="max-w-3xl mx-auto mt-4 px-6 flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-cool-gray/60 uppercase tracking-widest py-1">Stylist Preferences:</span>
                      {parsedQuery.color && <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase">{parsedQuery.color}</span>}
                      {parsedQuery.category && <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase">{parsedQuery.category}</span>}
                      {parsedQuery.formality && <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase">{parsedQuery.formality}</span>}
                      {parsedQuery.season && <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase">{parsedQuery.season}</span>}
                      {parsedQuery.occasion && <span className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] font-bold text-accent uppercase">{parsedQuery.occasion}</span>}
                      <button 
                        onClick={() => {
                          setSearchQuery("");
                          setParsedQuery(null);
                          setChatHistory([]);
                        }}
                        className="ml-auto text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline"
                      >
                        {isEs ? "Limpiar Chat y Filtros" : "Clear Chat & Filters"}
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                <div className="max-w-3xl mx-auto p-12 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/20 fashion-shadow-sm text-center -mt-12 relative z-20">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-accent/20">
                    <MessageCircle className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-xl font-display font-bold text-navy mb-2">
                    {isEs ? "Desbloquear Estilista NLP" : "Unlock NLP Stylist"}
                  </h3>
                  <p className="text-cool-gray text-sm mb-6 max-w-xs mx-auto">
                    {isEs 
                      ? "Chatea con Aura y recibe asesoría de estilo personalizada usando lenguaje natural. Mejora a nivel Pro para desbloquear." 
                      : "Chat with Aura and get personalized advice using natural language. Upgrade to Pro Tier to unlock."
                    }
                  </p>
                  <button 
                    onClick={() => setSubscriptionTier(SubscriptionTier.PRO)}
                    className="px-8 py-3 bg-navy text-white rounded-full font-bold text-sm hover:bg-navy/80 transition-all"
                  >
                    {isEs ? "Mejorar a Pro" : "Upgrade to Pro"}
                  </button>
                </div>
              )}
              {/* Wardrobe Section */}
              <section ref={wardrobeRef} className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                  <div>
                    <h2 className="text-3xl font-display font-bold mb-2 text-navy">
                      {isEs ? "Tu Guardarropa" : "Your Wardrobe"}
                    </h2>
                    <p className="text-cool-gray">
                      {wardrobe.length === 0 
                        ? (isEs ? "Sube prendas para iniciar el análisis con IA." : "Upload items to start your AI analysis.") 
                        : (isEs ? `Tienes ${wardrobe.length} prendas en tu colección.` : `You have ${wardrobe.length} items in your collection.`)
                      }
                    </p>

                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <label className="cursor-pointer bg-navy text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-navy/90 transition-all fashion-shadow shadow-lg">
                      <Plus className="w-5 h-5 text-accent" />
                      {wardrobe.length === 0 
                        ? (isEs ? "Subir Ropa" : "Upload Clothing") 
                        : (isEs ? "Añadir Prenda" : "Add Item")
                      }
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                    </label>
                    {isAnalyzing && (
                      <div className="w-48 space-y-1">
                        <div className="flex justify-between text-[8px] font-bold text-accent uppercase">
                          <span>Processing</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-1 bg-cool-gray/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {wardrobe.map(item => (
                    <ItemCard 
                      key={item.id} 
                      item={item} 
                      onSelect={() => toggleOutfitItem(item)}
                      isSelected={!!selectedOutfit.find(i => i.id === item.id)}
                       onConfirm={confirmWardrobeItem}
                       onUpdateCategory={updateWardrobeItemCategory}
                       onDelete={deleteWardrobeItem}
                       isPremium={subscriptionTier === SubscriptionTier.PREMIUM}
                    />
                  ))}
                  {isAnalyzing && (
                    <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-accent/30 flex flex-col items-center justify-center gap-3 bg-accent/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-accent/10 to-transparent" />
                      <Sparkles className="w-8 h-8 text-accent animate-bounce relative z-10" />
                      <div className="text-center relative z-10">
                        <span className="text-[10px] font-bold text-accent uppercase block">Analyzing</span>
                        <span className="text-lg font-display font-bold text-accent">{uploadProgress}%</span>
                      </div>
                      <div className="w-2/3 h-1 bg-accent/10 rounded-full overflow-hidden relative z-10">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ type: "spring", stiffness: 50, damping: 20 }}
                          className="h-full bg-accent"
                        />
                      </div>
                      <p className="absolute bottom-4 text-[8px] font-bold text-accent/60 uppercase tracking-widest">Estimated: {Math.max(0, Math.ceil((100 - uploadProgress) / 20))}s</p>
                    </div>
                  )}
                  {wardrobe.length === 0 && !isAnalyzing && (
                                         <div className="col-span-full py-24 text-center border-2 border-dashed border-cool-gray/10 rounded-[40px] bg-cool-gray/5 flex flex-col items-center justify-center space-y-6">

                                             <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center fashion-shadow relative">
                         <ShoppingBag className="w-10 h-10 text-cool-gray/20" />
                         <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-lg">
                           <Plus className="w-4 h-4 text-white" />
                         </div>
                       </div>

                       <div className="space-y-2">
                         <h3 className="text-xl font-display font-bold text-navy">Your wardrobe is empty</h3>
                         <p className="text-cool-gray text-sm max-w-xs mx-auto">Upload your first item to get started with AI-powered style analysis and recommendations.</p>
                       </div>
                       <label className="cursor-pointer bg-navy text-white px-10 py-4 rounded-full font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-xl flex items-center gap-3">
                         <Upload className="w-5 h-5 text-accent" />
                         Upload Your First Item
                         <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
                       </label>
                     </div>

                  )}
                </div>

                {analysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid md:grid-cols-2 gap-6"
                  >
                    <div className="p-6 rounded-3xl bg-navy text-white space-y-4 fashion-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-accent">
                          <Info className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-widest text-xs">Analysis Summary</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-[10px] font-bold text-white/40 uppercase">AI Accuracy</div>
                            <div className="text-xs font-bold text-accent">{Math.round(analysis.averageConfidence * 100)}%</div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${analysis.averageConfidence >= 0.65 ? 'border-emerald-500 text-emerald-500' : 'border-amber-500 text-amber-500'}`}>
                            {analysis.averageConfidence >= 0.65 ? <ShieldCheck className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/10">
                        <div>
                          <div className="text-[10px] font-bold text-white/40 uppercase">Total Items</div>
                          <div className="text-xl font-display font-bold">
                            {analysis.averageConfidence >= 0.65 || analysis.confirmedItems === analysis.totalItems ? analysis.totalItems : "???"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-white/40 uppercase">Confirmed</div>
                          <div className="text-xl font-display font-bold text-accent">
                            {analysis.confirmedItems}
                          </div>
                        </div>
                      </div>

                      <ul className="space-y-3">
                        {analysis.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-white/80 flex gap-2">
                            <span className="text-accent">•</span> {s}
                          </li>
                        ))}
                      </ul>

                      {analysis.missingEssentials.length > 0 && (
                        <div className="pt-4 border-t border-white/10">
                          <div className="text-[10px] font-bold text-accent uppercase mb-2">Missing Essentials</div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missingEssentials.map(e => (
                              <span key={e} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-medium text-white/70">
                                {e}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-6 rounded-3xl bg-cool-gray/5 border border-cool-gray/10 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-cool-gray">
                          <Palette className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-widest text-xs">Color Palette</h3>
                        </div>
                        <span className="text-[10px] font-bold text-cool-gray bg-white px-2 py-1 rounded border border-cool-gray/10">INTERACTIVE</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center relative min-h-[120px]">
                        {Object.entries(analysis.colorBalance).map(([color, count], idx, arr) => {
                          const statsTotal = Object.values(analysis.colorBalance).reduce((a, b) => (a as number) + (b as number), 0) as number;
                          const percentage = ((count as number) / statsTotal) * 100;
                          const size = 40 + (percentage * 0.8);
                          // Simple circular layout
                          const angle = (idx / arr.length) * 2 * Math.PI;
                          const radius = 30;
                          const x = Math.cos(angle) * radius;
                          const y = Math.sin(angle) * radius;
                          
                          // Normalize color for CSS
                          const displayColor = color.startsWith('#') ? color : color.split(' ').pop()?.toLowerCase() || color;
                          
                          return (
                            <motion.div
                              key={color}
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              whileHover={{ scale: 1.2, zIndex: 10 }}
                              className="absolute cursor-pointer group"
                              style={{ 
                                width: size, 
                                height: size,
                                left: `calc(50% + ${x}px - ${size/2}px)`,
                                top: `calc(50% + ${y}px - ${size/2}px)`,
                              }}
                            >
                              <div 
                                className="w-full h-full rounded-full shadow-lg border-2 border-cool-gray/20 flex items-center justify-center overflow-hidden relative"
                                style={{ backgroundColor: displayColor }}
                              >
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute inset-0 border border-black/5 rounded-full pointer-events-none" />
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-white drop-shadow-md transition-opacity z-10">
                                  {Math.round(percentage)}%
                                </span>
                              </div>
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                <span className="text-[10px] font-bold text-navy bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter border border-cool-gray/10">{color}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </section>

              {/* Stylist Section */}
              <section className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <h2 className="text-3xl font-display font-bold mb-2 text-navy">Aura Stylist</h2>
                    <p className="text-cool-gray">Personalized recommendations based on your collection.</p>
                    {selectedOutfit.length > 0 && (
                      <div className="flex items-center gap-4 mt-4">
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 bg-accent/10 px-4 py-2 rounded-full border border-accent/20"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-white shadow-sm">
                            <img src={selectedOutfit[0].imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <span className="text-xs font-bold text-accent uppercase tracking-wider">Pairing Mode Active</span>
                          <button 
                            onClick={() => setSelectedOutfit([])}
                            className="text-[10px] font-bold text-cool-gray hover:text-accent transition-colors"
                          >
                            CLEAR
                          </button>
                        </motion.div>
                        
                        <button 
                          onClick={generateRecommendations}
                          disabled={isGeneratingRecs}
                          className="bg-navy text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-navy/90 transition-all shadow-lg flex items-center gap-2"
                        >
                          {isGeneratingRecs ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Styling...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-accent" />
                              Analyze & Style
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 bg-cool-gray/5 p-1 rounded-full border border-cool-gray/10">
                    <button 
                      onClick={() => {
                        if (isGiftModeActive) {
                          setCurrentView('gift-results');
                        } else {
                          setShowGiftMode(true);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isGiftModeActive ? 'bg-accent text-white shadow-md' : 'text-cool-gray hover:bg-cool-gray/10'}`}
                    >
                      <Gift className="w-4 h-4" />
                      {isGiftModeActive ? "View Gift Results" : "Gift Mode"}
                    </button>
                    <button 
                      onClick={() => setFilters(f => ({ ...f, modestyEnforced: !f.modestyEnforced }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${filters.modestyEnforced ? 'bg-navy text-white' : 'text-cool-gray hover:bg-cool-gray/10'}`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Modesty Mode
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-cool-gray">
                      <Filter className="w-4 h-4" />
                      <select 
                        className="bg-transparent font-medium focus:outline-none cursor-pointer text-navy"
                        value={filters.season}
                        onChange={(e) => setFilters(f => ({ ...f, season: e.target.value as any }))}
                      >
                        <option value="All">All Seasons</option>
                        {Object.values(Season).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select 
                        className="bg-transparent font-medium focus:outline-none cursor-pointer text-navy"
                        value={filters.occasion}
                        onChange={(e) => setFilters(f => ({ ...f, occasion: e.target.value as any }))}
                      >
                        <option value="All">All Occasions</option>
                        {Object.values(Occasion).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                
                {stylistAdvice && !isGeneratingRecs && (
                  <div className="space-y-12">
                    {/* Style Score Analysis */}
                    {lastUploadedItem && lastUploadedItemScore && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-[40px] bg-white border border-cool-gray/10 fashion-shadow"
                      >
                        <div className="flex flex-col items-center justify-center p-6 bg-accent/5 rounded-[32px] border border-accent/10">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-2">Style Score</span>
                          <div className="text-6xl font-display font-black text-navy flex items-baseline">
                            {lastUploadedItemScore.score}
                            <span className="text-xl text-cool-gray/40 ml-1">/10</span>
                          </div>
                        </div>
                        <div className="md:col-span-2 flex flex-col justify-center space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-accent" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-navy">Professional Style Analysis</h3>
                          </div>
                          <p className="text-cool-gray font-medium leading-relaxed italic">
                            "{lastUploadedItemScore.explanation}"
                          </p>
                          <div className="flex flex-wrap gap-3">
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-navy bg-cool-gray/5 px-3 py-1.5 rounded-full border border-cool-gray/10">
                                Versatility: {lastUploadedItemScore.score > 8.5 ? "Superior" : lastUploadedItemScore.score > 7 ? "Excellent" : lastUploadedItemScore.score > 5 ? "Good" : "Average"}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-navy bg-cool-gray/5 px-3 py-1.5 rounded-full border border-cool-gray/10">
                                Outfit Potential: {lastUploadedItemScore.score > 7.5 ? "Very High" : "Moderate"}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-navy bg-cool-gray/5 px-3 py-1.5 rounded-full border border-cool-gray/10">
                                Timelessness: {lastUploadedItemScore.score > 8 ? "Classic" : "Trend-Led"}
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Style Switch Selector */}
                    {isFeatureEnabled(SubscriptionTier.PRO) ? (
                      (selectedOutfit.length > 0 || lastUploadedItem) && (
                        <div className="flex flex-col gap-6 p-8 rounded-[40px] bg-white border border-cool-gray/10 fashion-shadow">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Style Switch</span>
                            <h3 className="text-2xl font-display font-bold text-navy">Refine Your Vibe</h3>
                          </div>
                          <div className="flex p-1.5 bg-cool-gray/5 rounded-2xl w-fit">
                            {[
                              { id: Formality.CASUAL, label: "Casual" },
                              { id: Formality.SMART_CASUAL, label: "Smart" },
                              { id: "Streetwear", label: "Streetwear" }
                            ].map((style) => (
                              <button
                                key={style.id}
                                onClick={() => setStyleSwitchMode(styleSwitchMode === style.id ? null : style.id as any)}
                                className={`px-8 py-3 rounded-xl font-bold text-sm transition-all relative ${
                                  styleSwitchMode === style.id 
                                    ? "text-white bg-navy shadow-lg" 
                                    : "text-cool-gray hover:text-navy hover:bg-white"
                                }`}
                              >
                                {style.label}
                                {styleSwitchMode === style.id && (
                                  <motion.div 
                                    layoutId="style-active"
                                    className="absolute inset-0 bg-navy rounded-xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 bg-white border border-cool-gray/10 rounded-[40px] fashion-shadow text-center">
                         <div className="w-12 h-12 bg-cool-gray/5 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-cool-gray/40" />
                         </div>
                         <h3 className="text-lg font-display font-bold text-navy mb-1">Improved Ranking Locked</h3>
                         <p className="text-cool-gray text-[10px] font-bold uppercase tracking-widest mb-4">Upgrade to PRO tier</p>
                         <button 
                           onClick={() => setSubscriptionTier(SubscriptionTier.PRO)}
                           className="text-xs font-bold text-accent hover:underline"
                         >
                           View Pro Features
                         </button>
                      </div>
                    )}

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 rounded-[40px] bg-gradient-to-br from-navy to-navy/90 text-white relative overflow-hidden fashion-shadow"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                      <div className="relative z-10 flex gap-6 items-start">
                        <div className="w-14 h-14 bg-accent rounded-[20px] flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
                          <Sparkles className="w-7 h-7 text-white" />
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Personal AI Stylist Advice</span>
                          <p className="text-xl font-display font-medium leading-relaxed italic text-white/90">
                            "{stylistAdvice}"
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {lastUploadedItem && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-8 rounded-[40px] bg-white border border-cool-gray/10 fashion-shadow overflow-hidden relative"
                      >
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Plus className="w-24 h-24 text-navy rotate-12" />
                         </div>
                         <div className="relative z-10 space-y-8">
                            <div className="flex flex-col gap-2">
                              <h3 className="text-2xl font-display font-bold text-navy">Complete Your Outfit</h3>
                              <p className="text-cool-gray font-medium">These items will help you create more outfits with your {lastUploadedItem.color} {lastUploadedItem.category}.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {CATALOG_ITEMS
                                .filter(item => getMissingCategories(lastUploadedItem!.category).includes(item.category))
                                .slice(0, 3)
                                .map(item => (
                                  <div key={item.id} className="relative group">
                                    <div className="absolute -top-3 -right-3 z-10 bg-accent text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                      Essential
                                    </div>
                                    <ItemCard 
                                      item={item} 
                                      onSelect={() => setSelectedOutfit([item])}
                                      isPremium={subscriptionTier === SubscriptionTier.PREMIUM}
                                    />
                                  </div>
                                ))}
                            </div>
                         </div>
                      </motion.div>
                    )}
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-8 relative">
                  {isGeneratingRecs && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-[32px] flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
                          <Sparkles className="w-6 h-6 text-accent animate-spin-slow" />
                        </div>
                        <p className="text-xs font-bold text-navy uppercase tracking-widest">Curating Your Look...</p>
                      </div>
                    </div>
                  )}
                  <AnimatePresence mode="popLayout">
                    {recommendations.map((item, idx) => (
                      <motion.div 
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-4"
                      >
                        {/* Side-by-Side Pairing View */}
                        {(selectedOutfit.length > 0 || lastUploadedItem) ? (
                          <div className="flex gap-2 items-center p-3 bg-white rounded-[32px] border border-cool-gray/10 shadow-sm hover:shadow-md transition-all">
                            <TrackedWrapper 
                              productId={selectedOutfit.length > 0 ? selectedOutfit[0].id : lastUploadedItem!.id} 
                              className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-cool-gray/5 shadow-inner relative group"
                              isPremium={subscriptionTier === SubscriptionTier.PREMIUM}
                            >
                              <img src={selectedOutfit.length > 0 ? selectedOutfit[0].imageUrl : lastUploadedItem!.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute bottom-2 left-2 bg-navy/90 text-[8px] text-white px-2 py-1 rounded-full font-bold uppercase tracking-tighter">
                                {selectedOutfit.length > 0 ? "Your Choice" : "Uploaded Item"}
                              </div>
                            </TrackedWrapper>
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center -mx-4 z-10 border-2 border-white shadow-sm">
                              <Plus className="w-4 h-4 text-accent" />
                            </div>
                            <TrackedWrapper 
                              productId={item.id} 
                              className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-accent/20 shadow-inner relative group cursor-pointer" 
                              onClick={() => setSelectedOutfit([item])}
                              isPremium={subscriptionTier === SubscriptionTier.PREMIUM}
                            >
                              <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <div className="absolute bottom-2 right-2 bg-accent/90 text-[8px] text-white px-2 py-1 rounded-full font-bold uppercase tracking-tighter">AI Match</div>
                            </TrackedWrapper>
                          </div>
                        ) : (
                          <ItemCard item={item} isPremium={subscriptionTier === SubscriptionTier.PREMIUM} />
                        )}
                        
                        {item.reasoning && (
                          <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 relative">
                            <div className="absolute -top-2 left-4 px-2 bg-accent text-white text-[8px] font-bold rounded uppercase">Aura Insight</div>
                            <p className="text-xs text-cool-gray leading-relaxed italic">
                              "{item.reasoning}"
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => addToCart(item)}
                            className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2 fashion-shadow"
                          >
                            Add to Cart
                          </button>
                          <button 
                            onClick={() => isGiftModeActive ? setSharingItem(item) : saveRecommendation(item.brand + " " + item.category, item.reasoning || "AI Recommended", [item])}
                            className={`p-3 rounded-xl border border-cool-gray/10 transition-all ${isGiftModeActive ? 'bg-accent/10 border-accent/20' : 'hover:bg-cool-gray/5'}`}
                            title={isGiftModeActive ? "Share Gift" : "Save to Profile"}
                          >
                            {isGiftModeActive ? <Share2 className="w-4 h-4 text-accent" /> : <Heart className="w-4 h-4 text-accent" />}
                          </button>
                          <button 
                            onClick={() => window.open(item.purchaseUrl, '_blank')}
                            className="px-4 py-3 rounded-xl bg-cool-gray/10 text-navy text-sm font-bold hover:bg-cool-gray/20 transition-all"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Outfit Builder & Accessories */}
              {selectedOutfit.length > 0 && (
                <motion.section 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-10 rounded-[40px] bg-cool-gray/5 border border-cool-gray/10 space-y-10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-display font-bold mb-1 text-navy">Current Look</h2>
                      <p className="text-cool-gray text-sm">Building an outfit from your collection.</p>
                    </div>
                    <button 
                      onClick={() => setSelectedOutfit([])}
                      className="p-2 rounded-full hover:bg-cool-gray/10 transition-colors"
                    >
                      <X className="w-5 h-5 text-cool-gray" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-8 items-start">
                    <div className="flex -space-x-12">
                      {selectedOutfit.map((item, i) => (
                        <motion.div 
                          key={item.id}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-40 h-52 rounded-2xl overflow-hidden border-4 border-white shadow-xl rotate-[-5deg] hover:rotate-0 hover:scale-110 hover:z-20 transition-all"
                        >
                          <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-accent">
                          <ShoppingBag className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-widest text-xs">Recommended Accessories</h3>
                        </div>
                        <button 
                          onClick={() => window.open('https://example.com/shop-the-look', '_blank')}
                          className="px-4 py-2 rounded-full bg-accent text-white text-[10px] font-bold hover:bg-accent/90 transition-all fashion-shadow flex items-center gap-1"
                        >
                          Shop the Entire Look <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {accessories.map(acc => (
                          <div key={acc.id} className="flex gap-4 items-center p-3 rounded-2xl bg-white border border-cool-gray/10 fashion-shadow group">
                            <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                              <img src={acc.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-accent uppercase">{acc.brand}</p>
                              <p className="text-sm font-medium text-navy truncate">{acc.category}</p>
                              <div className="flex gap-2 mt-1">
                                <button className="text-[10px] font-bold text-cool-gray hover:text-accent transition-colors">ADD TO OUTFIT</button>
                                <button 
                                  onClick={() => addToCart(acc)}
                                  className="text-[10px] font-bold text-accent hover:underline transition-colors"
                                >
                                  BUY NOW
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </main>
          </motion.div>
        )}

        {currentView === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Dashboard 
              wardrobe={wardrobe} 
              analysis={analysis} 
              tier={subscriptionTier}
              isFeatureEnabled={isFeatureEnabled}
              setCurrentView={setCurrentView}
            />
          </motion.div>
        )}

        {currentView === 'pricing' && (
          <motion.div
            key="pricing"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Pricing currentTier={subscriptionTier} onSelectTier={setSubscriptionTier} />
          </motion.div>
        )}

        {currentView === 'checkout' && (
          <motion.div
            key="checkout"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Checkout items={cart} onBack={() => setCurrentView('stylist')} />
          </motion.div>
        )}

        {currentView === 'profile' && user && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Profile 
              user={user} 
              wardrobe={wardrobe} 
              savedRecommendations={savedRecommendations}
              onUpdateProfile={handleUpdateProfile}
              onDeleteWardrobeItem={deleteWardrobeItem}
              tier={subscriptionTier}
              onViewChange={setCurrentView}
            />
          </motion.div>
        )}

        {currentView === 'gift-results' && (
          <motion.div
            key="gift-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <GiftResults 
              recommendations={recommendations} 
              giftConfig={giftConfig} 
              onShare={setSharingItem} 
              onBack={() => setCurrentView('stylist')} 
              onClear={() => {
                setIsGiftModeActive(false);
                setCurrentView('stylist');
                showNotification("Exited Gift Mode", "info");
              }}
              onAdjust={() => setShowGiftMode(true)}
              tier={subscriptionTier}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md text-white ${
              notification.type === 'error' 
                ? 'bg-red-500/90 border-red-500/20' 
                : notification.type === 'success' 
                  ? 'bg-emerald-500/90 border-emerald-500/20' 
                  : 'bg-navy/90 border-white/10'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> : notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Info className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Mode Modal */}
      <AnimatePresence>
        {showGiftMode && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGiftMode(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-8 bg-navy text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="relative z-10 flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">Premium Concierge</span>
                    </div>
                    <h3 className="text-3xl font-display font-bold">Curate the Perfect Gift</h3>
                    <p className="text-white/60 text-sm max-w-md">Our AI stylist will select versatile, high-confidence pieces tailored for your recipient.</p>
                  </div>
                  <button 
                    onClick={() => setShowGiftMode(false)}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1 tracking-widest">Recipient Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Sarah" 
                        value={giftConfig.recipientName}
                        onChange={(e) => setGiftConfig({...giftConfig, recipientName: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy font-medium transition-all" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1 tracking-widest">Recipient Type</label>
                      <div className="flex gap-2">
                        {['Woman', 'Man', 'Unisex'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setGiftConfig({...giftConfig, recipientType: t})}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold border transition-all ${giftConfig.recipientType === t ? 'bg-accent text-white border-accent shadow-md' : 'bg-white text-cool-gray border-cool-gray/10 hover:border-accent/30'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1 tracking-widest">Budget Preference</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Value', 'Mid-range', 'Luxury'].map((b) => (
                          <button
                            key={b}
                            onClick={() => setGiftConfig({...giftConfig, budget: b})}
                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${giftConfig.budget === b ? 'bg-navy text-white border-navy shadow-md' : 'bg-white text-cool-gray border-cool-gray/10 hover:border-accent/30'}`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1 tracking-widest">Occasion</label>
                      <select 
                        value={giftConfig.occasion}
                        onChange={(e) => setGiftConfig({...giftConfig, occasion: e.target.value as any})}
                        className="w-full px-5 py-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy font-medium transition-all appearance-none"
                      >
                        {Object.values(Occasion).map(o => <option key={o} value={o}>{o}</option>)}
                        <option value="Other">Other Special Event</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-cool-gray ml-1 tracking-widest">Style Notes (Optional)</label>
                      <textarea 
                        placeholder="e.g. Loves minimalist aesthetics, prefers silk..." 
                        rows={5}
                        value={giftConfig.customInstructions}
                        onChange={(e) => setGiftConfig({...giftConfig, customInstructions: e.target.value})}
                        className="w-full px-5 py-4 rounded-2xl bg-cool-gray/5 border border-cool-gray/10 focus:outline-none focus:ring-2 ring-accent/20 text-navy font-medium transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Safety Note */}
                <div className="p-6 rounded-[32px] bg-accent/5 border border-accent/10 flex gap-4 items-start">
                  <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-navy uppercase tracking-wider">AI Safe-Choice Algorithm</h4>
                    <p className="text-[11px] text-cool-gray leading-relaxed">
                      Automatically prioritizes timeless silhouettes and high-versatility pieces to ensure your gift is loved and worn.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-cool-gray/10 bg-cool-gray/5 flex gap-4">
                <button 
                  onClick={() => setShowGiftMode(false)}
                  className="px-8 py-4 rounded-2xl border border-cool-gray/20 text-navy font-bold hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setIsGiftModeActive(true);
                    setShowGiftMode(false);
                    setCurrentView('gift-results');
                    showNotification("Curating premium gift recommendations...", "success");
                  }}
                  className="flex-1 py-4 rounded-2xl bg-navy text-white font-bold hover:bg-navy/90 transition-all fashion-shadow shadow-xl flex items-center justify-center gap-3 group"
                >
                  Generate Gift Selection
                  <Sparkles className="w-5 h-5 text-accent group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-8 right-8 md:hidden">
        <label className="w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer fashion-shadow">
          <Plus className="w-6 h-6" />
          <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
        </label>
      </div>

      <ShareModal 
        isOpen={!!sharingItem} 
        onClose={() => setSharingItem(null)} 
        item={sharingItem} 
        recipientName={giftConfig.recipientName}
      />

    </div>
  );
}
