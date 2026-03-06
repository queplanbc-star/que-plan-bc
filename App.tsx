import React, { useState, useEffect, useRef } from 'react';
import { CulturalEvent, EventCategory, ViewMode } from './types';
import { EventCard } from './components/EventCard';
import { EventModal } from './components/EventModal';
import { AdminPanel } from './components/AdminPanel';
import { AIAssistant } from './components/AIAssistant';
import { AuthModal } from './components/AuthModal';
import { PlanDrawer } from './components/PlanDrawer';
import { AddToPlanModal } from './components/AddToPlanModal';
import { ProfileModal } from './components/ProfileModal';
import { ContactSection } from './components/ContactSection';
import { fetchEvents, fetchConfig, AppConfig } from './services/dataService'; // Importamos el servicio de datos
import { 
  auth, 
  signInWithGoogle, 
  logout, 
  checkRedirectResult,
  getUserPlans,
  UserPlan,
  getUserProfile
} from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Calendar, 
  Search, 
  ShoppingBag, 
  Menu, 
  X, 
  Database, 
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  List,
  Plus,
  Check,
  Heart,
  Coffee,
  Loader2,
  LogOut,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';

const App: React.FC = () => {
  const [events, setEvents] = useState<CulturalEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CulturalEvent | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // App Config & Sharing
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [sharedEventIds, setSharedEventIds] = useState<string[]>([]);

  // New Plans Logic State
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [isPlanDrawerOpen, setIsPlanDrawerOpen] = useState(false);
  const [eventToAdd, setEventToAdd] = useState<CulturalEvent | null>(null);
  
  // Advanced Filters State
  const [explorationCategories, setExplorationCategories] = useState<string[]>([]); // For Exploration Section
  const [planCategories, setPlanCategories] = useState<string[]>([]); // For Arma tu plan Section
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Arma tu plan Filters
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  const [timeFilterStart, setTimeFilterStart] = useState('');
  const [timeFilterEnd, setTimeFilterEnd] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const todayScrollRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auth State Listener
  useEffect(() => {
    console.log("Initializing Auth Listener...");
    
    // 1. Listen for auth state changes (persists session on refresh)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("onAuthStateChanged triggered:", user ? `User found: ${user.email}` : "No user found");
      
      if (user) {
        // Fetch custom profile from Firestore
        const userProfile = await getUserProfile(user.uid);
        const enhancedUser = { ...user, ...userProfile } as any;
        setCurrentUser(enhancedUser);
        
        // Load plans
        const plans = await getUserPlans(user.uid);
        setUserPlans(plans);
      } else {
        setCurrentUser(null);
        setUserPlans([]);
      }
    });
    
    // 2. Check for redirect result (captures session after returning from Google)
    checkRedirectResult().then(async (user) => {
      if (user) {
        console.log("User signed in via redirect (checkRedirectResult):", user.displayName);
        const userProfile = await getUserProfile(user.uid);
        const enhancedUser = { ...user, ...userProfile } as any;
        setCurrentUser(enhancedUser);
        
        const plans = await getUserPlans(user.uid);
        setUserPlans(plans);
      } else {
         // 3. Fallback: Check if auth.currentUser is already populated but listener hasn't fired
         if (auth.currentUser) {
             console.log("Fallback: auth.currentUser exists:", auth.currentUser.email);
             const userProfile = await getUserProfile(auth.currentUser.uid);
             const enhancedUser = { ...auth.currentUser, ...userProfile } as any;
             setCurrentUser(enhancedUser);
             
             const plans = await getUserPlans(auth.currentUser.uid);
             setUserPlans(plans);
         }
      }
    }).catch(err => {
      console.error("Redirect login error:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleProfileUpdated = async () => {
    if (auth.currentUser) {
      const userProfile = await getUserProfile(auth.currentUser.uid);
      const enhancedUser = { ...auth.currentUser, ...userProfile } as any;
      setCurrentUser(enhancedUser);
    }
  };

  // Load events on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchEvents();
      setEvents(data);
      setIsLoading(false);
    };

    loadData();

    // Check for admin mode in URL (e.g., ?admin=true)
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdminMode(true);
    }

    // Check for shared IDs
    const idsParam = params.get('ids');
    if (idsParam) {
      const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length > 0) {
        setSharedEventIds(ids);
      }
    }

    // Load Config
    const loadConfig = async () => {
      const config = await fetchConfig();
      setAppConfig(config);
      
      // Update Meta Tags if config exists
      if (config.previewImageUrl) {
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', config.previewImageUrl);
      }
      // Note: og:title and og:description are usually static or set server-side, 
      // but we can try to update them for client-side previews if supported.
    };
    loadConfig();

  }, []);

  // Helper to get local date string YYYY-MM-DD
  const getLocalToday = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. EXPLORATION FILTER LOGIC
  const explorationEvents = events.filter(event => {
    // Shared Mode: Show ONLY shared events if active
    if (sharedEventIds.length > 0) {
      return sharedEventIds.includes(event.id);
    }

    // Filter Past Events
    const today = getLocalToday();
    if (event.date < today) return false;

    // Category Filter
    const matchesCategory = explorationCategories.length === 0 || explorationCategories.some(cat => 
      cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
      event.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    
    // Search Filter
    const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matchesSearch = normalizeText(event.title).includes(normalizeText(searchQuery));
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  // 2. ARMA TU PLAN FILTER LOGIC
  const planEvents = events.filter(event => {
    // Filter Past Events
    const today = getLocalToday();
    if (event.date < today) return false;

    // Category Filter (Independent)
    const matchesCategory = planCategories.length === 0 || planCategories.some(cat => 
      cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === 
      event.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    // Date Filter
    let matchesDate = true;
    if (dateFilterStart && !dateFilterEnd) {
      // Exact match if only start date is provided
      matchesDate = event.date === dateFilterStart;
    } else if (dateFilterStart && dateFilterEnd) {
      // Range match if both are provided
      matchesDate = event.date >= dateFilterStart && event.date <= dateFilterEnd;
    } else if (!dateFilterStart && dateFilterEnd) {
      // Up to end date
      matchesDate = event.date <= dateFilterEnd;
    }

    // Time Filter
    let matchesTime = true;
    if (timeFilterStart && !timeFilterEnd) {
      // Exact match if only start time is provided
      matchesTime = event.time === timeFilterStart;
    } else if (timeFilterStart && timeFilterEnd) {
      // Range match if both are provided
      matchesTime = event.time >= timeFilterStart && event.time <= timeFilterEnd;
    } else if (!timeFilterStart && timeFilterEnd) {
      // Up to end time
      matchesTime = event.time <= timeFilterEnd;
    }

    return matchesCategory && matchesDate && matchesTime;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const isPlanActive = planCategories.length > 0 || dateFilterStart !== '' || dateFilterEnd !== '' || timeFilterStart !== '' || timeFilterEnd !== '';

  // Sync Plans on Login / Logout
  useEffect(() => {
    const loadPlans = async () => {
      if (currentUser) {
        const plans = await getUserPlans(currentUser.uid);
        setUserPlans(plans);
      } else {
        setUserPlans([]);
      }
    };
    loadPlans();
  }, [currentUser]);

  const refreshPlans = async () => {
    if (currentUser) {
      const plans = await getUserPlans(currentUser.uid);
      setUserPlans(plans);
    }
  };

  // Plan Management (Trigger Modal)
  const handleAddToPlanClick = (event: CulturalEvent) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setEventToAdd(event);
  };

  const todayEvents = events
    .filter(e => e.date === getLocalToday())
    .sort((a, b) => a.time.localeCompare(b.time));

  const scrollToday = (direction: 'left' | 'right') => {
    if (todayScrollRef.current) {
      const { current } = todayScrollRef;
      const scrollAmount = 300;
      current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleExplorationCategory = (cat: string) => {
    if (cat === EventCategory.ALL) {
      setExplorationCategories([]); 
      return;
    }
    
    // Single selection logic:
    // If the category is already selected, deselect it (show all).
    // Otherwise, select ONLY this category (replacing any previous selection).
    if (explorationCategories.includes(cat)) {
      setExplorationCategories([]);
    } else {
      setExplorationCategories([cat]);
    }
  };

  const togglePlanCategory = (cat: string) => {
    if (planCategories.includes(cat)) {
      setPlanCategories(planCategories.filter(c => c !== cat));
    } else {
      setPlanCategories([...planCategories, cat]);
    }
  };

  // Extract categories from Enum
  const categoryList = Object.values(EventCategory);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // Ensure we are in home view to see results
      if (viewMode !== 'home') {
        setViewMode('home');
        // Small delay to allow render before scrolling
        setTimeout(() => {
          const resultsSection = document.getElementById('exploration-results');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        const resultsSection = document.getElementById('exploration-results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      // Close mobile menu if open
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Cargando cartelera...</h2>
          <p className="text-gray-500 text-sm mt-2">Buscando los mejores eventos para ti</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      
      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setViewMode('home')}>
              <Calendar className="h-8 w-8 text-indigo-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Qué Plan</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  className="w-64 pl-10 pr-4 py-2 rounded-full bg-gray-100 border-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              <button 
                onClick={() => setViewMode('home')}
                className={`text-sm font-medium hover:text-indigo-600 ${viewMode === 'home' ? 'text-indigo-600' : 'text-gray-500'}`}
              >
                Explorar
              </button>

              {/* Admin Button - Only visible if ?admin=true in URL */}
              {isAdminMode && (
                <button 
                  onClick={() => setViewMode('admin')}
                  className={`text-sm font-medium hover:text-indigo-600 flex items-center ${viewMode === 'admin' ? 'text-indigo-600' : 'text-gray-500'}`}
                >
                  <Database className="w-4 h-4 mr-1" /> BD
                </button>
              )}

              {/* Donation Button */}
              <button 
                onClick={() => setShowDonationModal(true)}
                className="text-sm font-medium text-pink-500 hover:text-pink-600 flex items-center bg-pink-50 px-3 py-1.5 rounded-full transition-colors"
              >
                <Heart className="w-4 h-4 mr-1 fill-current" /> Apoyar
              </button>

              <button 
                onClick={() => {
                  setViewMode('home');
                  setTimeout(() => {
                    const contactSection = document.getElementById('contact-section');
                    if (contactSection) {
                      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600"
              >
                Contacto
              </button>

              {/* Open in New Window Button (Fix for iframe auth issues) */}
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center px-3 py-1.5 rounded-full transition-colors"
                title="Abrir en ventana nueva (Soluciona problemas de login)"
              >
                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
              </button>

              <button 
                onClick={() => setIsPlanDrawerOpen(true)}
                className="relative p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <ShoppingBag className="h-6 w-6 text-indigo-600" />
                {userPlans.reduce((acc, plan) => acc + plan.eventIds.length, 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                    {userPlans.reduce((acc, plan) => acc + plan.eventIds.length, 0)}
                  </span>
                )}
              </button>

              {/* User Profile / Login */}
              {currentUser ? (
                <div className="flex items-center space-x-3 pl-2 border-l border-gray-200">
                  <div className="flex flex-col items-end hidden lg:flex">
                    <button 
                      onClick={() => setIsProfileModalOpen(true)}
                      className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors text-right"
                    >
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="text-xs text-gray-500 hover:text-red-500 flex items-center"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => setIsProfileModalOpen(true)}
                    className="relative group"
                  >
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt="Perfil" 
                        className="w-9 h-9 rounded-full border border-gray-200 group-hover:border-indigo-400 transition-colors object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                        {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : <UserIcon className="w-5 h-5" />)}
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Entrar</span>
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-500 hover:text-gray-700">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4">
             <input
                  type="text"
                  placeholder="Buscar eventos..."
                  className="w-full pl-4 pr-4 py-2 rounded-lg bg-gray-100 border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchSubmit}
              />
              <div className="flex flex-col space-y-2">
                <button onClick={() => { setViewMode('home'); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-700 py-2">Explorar</button>
                <button onClick={() => { setIsPlanDrawerOpen(true); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-700 py-2">
                  Mi Plan ({userPlans.reduce((acc, plan) => acc + plan.eventIds.length, 0)})
                </button>
                {isAdminMode && (
                  <button onClick={() => { setViewMode('admin'); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-700 py-2">Base de Datos</button>
                )}
                <button onClick={() => { setShowDonationModal(true); setIsMobileMenuOpen(false); }} className="text-left font-medium text-pink-600 py-2 flex items-center"><Heart className="w-4 h-4 mr-2" /> Apoyar el proyecto</button>
                
                <div className="pt-4 border-t border-gray-100 mt-2">
                  {currentUser ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {currentUser.photoURL ? (
                          <img 
                            src={currentUser.photoURL} 
                            alt="Perfil" 
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                             {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : (currentUser.email ? currentUser.email[0].toUpperCase() : <UserIcon className="w-4 h-4" />)}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">
                          {currentUser.displayName || currentUser.email?.split('@')[0]}
                        </span>
                      </div>
                      <button 
                        onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                        className="text-sm text-red-500 font-medium"
                      >
                        Salir
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { handleLogin(); setIsMobileMenuOpen(false); }}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      <UserIcon className="w-4 h-4" />
                      <span>Iniciar Sesión</span>
                    </button>
                  )}
                </div>
              </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: HOME */}
        {viewMode === 'home' && (
          <div className="animate-fade-in">
            {/* Header / Hero */}
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
                ¿Qué <span className="text-indigo-600">Plan?</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                La cartelera cultural definitiva de tu ciudad. Encuentra música, arte, teatro y más.
              </p>
            </div>

            {/* Today's Highlights (Carousel) */}
            {todayEvents.length > 0 && (
              <section className="mb-12 relative">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Hoy</h2>
                </div>
                
                <div className="relative group">
                    {/* Left Arrow Button */}
                    <button 
                        onClick={() => scrollToday('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 hover:scale-110 transition-all hidden md:flex opacity-0 group-hover:opacity-100"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Scroll Container */}
                    <div 
                        ref={todayScrollRef}
                        className="flex overflow-x-auto gap-6 pb-4 snap-x scroll-smooth no-scrollbar"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                    {todayEvents.map(event => (
                        <div key={event.id} className="min-w-[280px] snap-center">
                        <EventCard 
                            event={event} 
                            isInPlan={userPlans.some(p => p.eventIds.includes(event.id))}
                            onTogglePlan={handleAddToPlanClick}
                            onClick={() => setSelectedEvent(event)}
                        />
                        </div>
                    ))}
                    </div>

                     {/* Right Arrow Button */}
                     <button 
                        onClick={() => scrollToday('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-gray-600 hover:text-indigo-600 hover:scale-110 transition-all hidden md:flex opacity-0 group-hover:opacity-100"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
              </section>
            )}

            {/* ARMA TU PLAN - The Gray Box */}
            <section id="arma-tu-plan" className="mb-12 pt-8 border-t border-gray-200">
              <div className="bg-gray-200 rounded-lg p-6 shadow-sm border border-gray-300">
                <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Arma tu plan!</h2>
                <p className="text-center text-gray-600 mb-6 -mt-4 text-sm">Filtra por fecha, hora y categoría para encontrar tu plan perfecto.</p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
                  
                  {/* Date Filter Group */}
                  <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-8 h-8 text-gray-800" />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                           type="date" 
                           className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
                           value={dateFilterStart}
                           onChange={(e) => setDateFilterStart(e.target.value)}
                           aria-label="Fecha inicio"
                        />
                         <input 
                           type="date" 
                           className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
                           value={dateFilterEnd}
                           onChange={(e) => setDateFilterEnd(e.target.value)}
                           aria-label="Fecha fin (opcional)"
                           placeholder="Fin"
                         />
                      </div>
                    </div>
                  </div>

                  {/* Plus Sign */}
                  <div className="hidden md:block">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>

                  {/* Time Filter Group */}
                  <div className="flex flex-col items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <Clock className="w-8 h-8 text-gray-800" />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                           type="time" 
                           className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
                           value={timeFilterStart}
                           onChange={(e) => setTimeFilterStart(e.target.value)}
                           aria-label="Hora inicio"
                        />
                        <input 
                            type="time" 
                            className="p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 w-full"
                            value={timeFilterEnd}
                            onChange={(e) => setTimeFilterEnd(e.target.value)}
                            aria-label="Hora fin"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plus Sign */}
                  <div className="hidden md:block">
                    <Plus className="w-6 h-6 text-gray-400" />
                  </div>

                  {/* List / Category Indicator */}
                  <div className="flex flex-col items-center gap-2 w-full md:w-auto relative" ref={categoryDropdownRef}>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}>
                      <List className="w-8 h-8 text-gray-800" />
                      <div className="text-sm font-bold text-gray-700 bg-white px-3 py-2 rounded-md border border-gray-300 min-w-[120px] text-center flex items-center justify-between hover:border-indigo-500 transition-colors">
                        <span>
                          {planCategories.length === 0 
                            ? 'Todas' 
                            : `${planCategories.length} selec.`
                          }
                        </span>
                        <ChevronLeft className={`w-4 h-4 ml-2 transition-transform ${isCategoryDropdownOpen ? '-rotate-90' : 'rotate-0'}`} />
                      </div>
                    </div>

                    {/* Category Dropdown */}
                    {isCategoryDropdownOpen && (
                      <div className="absolute top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-2 animate-fade-in">
                        <div className="flex justify-between items-center mb-2 px-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Categorías</span>
                          {planCategories.length > 0 && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPlanCategories([]); }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Limpiar
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-1">
                          {categoryList.filter(c => c !== EventCategory.ALL).map((cat) => {
                            const isSelected = planCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                onClick={(e) => { e.stopPropagation(); togglePlanCategory(cat); }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors ${
                                  isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span>{cat}</span>
                                {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </section>

            {/* PLAN RESULTS */}
            {isPlanActive && (
              <section id="plan-results" className="animate-fade-in space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-800">
                      {planEvents.length === 0 ? 'Sin resultados para tu plan' : 'Resultados de tu Plan'}
                    </h3>
                    <button 
                      onClick={() => { 
                        setDateFilterStart(''); 
                        setDateFilterEnd(''); 
                        setTimeFilterStart('');
                        setTimeFilterEnd('');
                        setPlanCategories([]);
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
                    >
                      Limpiar filtros de plan
                    </button>
                  </div>

                  {planEvents.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                      <LayoutGrid className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos para tu plan</h3>
                      <p className="mt-1 text-sm text-gray-500">Intenta ampliar tu rango de fechas, horario o categorías.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {planEvents.map(event => (
                        <EventCard 
                          key={event.id} 
                          event={event} 
                          isInPlan={userPlans.some(p => p.eventIds.includes(event.id))}
                          onTogglePlan={handleAddToPlanClick}
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </div>
                  )}
              </section>
            )}

            {/* Category Buttons (Multi-select) - EXPLORATION */}
            <section className="mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-2">
                {categoryList.map((cat) => {
                  const isSelected = cat === EventCategory.ALL 
                    ? explorationCategories.length === 0 
                    : explorationCategories.includes(cat);
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleExplorationCategory(cat)}
                      className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all shadow-sm border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 transform scale-105 shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      {isSelected && cat !== EventCategory.ALL && <Check className="w-3 h-3 inline mr-1" />}
                      {cat}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* EXPLORATION RESULTS */}
            <section id="exploration-results" className="animate-fade-in space-y-6 mb-16">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-800">
                    {sharedEventIds.length > 0 
                      ? 'Eventos Compartidos' 
                      : (explorationEvents.length === 0 ? 'Sin resultados' : 'Exploración de Eventos')}
                  </h3>
                  
                  {sharedEventIds.length > 0 ? (
                    <button 
                      onClick={() => {
                        setSharedEventIds([]);
                        // Remove query param from URL without reload
                        const newUrl = window.location.pathname;
                        window.history.pushState({}, '', newUrl);
                      }}
                      className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 font-medium transition-colors shadow-sm"
                    >
                      Ver toda la cartelera de Ensenada
                    </button>
                  ) : (
                    explorationCategories.length > 0 && (
                      <button 
                        onClick={() => setExplorationCategories([])}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium underline"
                      >
                        Ver todos
                      </button>
                    )
                  )}
                </div>

                {explorationEvents.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                    <LayoutGrid className="mx-auto h-10 w-10 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay eventos en esta categoría</h3>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {explorationEvents.map(event => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        isInPlan={userPlans.some(p => p.eventIds.includes(event.id))}
                        onTogglePlan={handleAddToPlanClick}
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                )}
            </section>

            {/* CONTACT SECTION */}
            <ContactSection id="contact-section" />
          </div>
        )}

        {/* VIEW: ADMIN (Hidden from Navigation, but code remains available) */}
        {viewMode === 'admin' && (
          <div className="max-w-4xl mx-auto">
            <AdminPanel 
              currentEvents={events} 
              onUpdateEvents={(newEvents) => {
                setEvents(newEvents);
              }} 
            />
          </div>
        )}

        {/* VIEW: MY PLAN - REMOVED */}
      </main>

      {/* AUTH MODAL */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      {/* PLAN DRAWER */}
      <PlanDrawer
        isOpen={isPlanDrawerOpen}
        onClose={() => setIsPlanDrawerOpen(false)}
        currentUser={currentUser}
        userPlans={userPlans}
        allEvents={events}
        onPlanCreated={refreshPlans}
        onEventRemoved={refreshPlans}
        onEventClick={setSelectedEvent}
        appConfig={appConfig}
      />

      {/* EVENT MODAL */}
      {selectedEvent && (
        <EventModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
          isInPlan={userPlans.some(p => p.eventIds.includes(selectedEvent.id))}
          onTogglePlan={handleAddToPlanClick}
        />
      )}

      {/* ADD TO PLAN MODAL */}
      <AddToPlanModal
        isOpen={!!eventToAdd}
        onClose={() => setEventToAdd(null)}
        event={eventToAdd}
        currentUser={currentUser}
        userPlans={userPlans}
        onPlanUpdated={refreshPlans}
      />

      {/* DONATION MODAL */}
      {showDonationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button 
              onClick={() => setShowDonationModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8 text-pink-500 fill-current animate-pulse" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu apoyo!</h3>
              <p className="text-gray-600 mb-6">
                ¿Qué Plan? es un proyecto gratuito para la comunidad. Si te ha sido útil, considera hacernos una donación para mantener los servidores activos y seguir mejorando.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button className="flex items-center justify-center py-3 px-4 rounded-xl border border-pink-200 hover:bg-pink-50 text-pink-600 font-semibold transition-colors">
                  <Coffee className="w-5 h-5 mr-2" />
                  Café ($20)
                </button>
                <button className="flex items-center justify-center py-3 px-4 rounded-xl border border-pink-200 hover:bg-pink-50 text-pink-600 font-semibold transition-colors">
                  <Coffee className="w-5 h-5 mr-2" />
                  Comida ($100)
                </button>
              </div>
              
              <button 
                onClick={() => {
                  alert("¡Gracias por tu intención! Esta es una demo, no se realizará ningún cargo.");
                  setShowDonationModal(false);
                }}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                Donar ahora
              </button>
              
              <p className="mt-4 text-xs text-gray-400">
                Pagos seguros procesados externamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        currentUser={currentUser}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* AI Assistant - Always available */}
      <AIAssistant events={events} />

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-base text-gray-400">
            &copy; {new Date().getFullYear()} Qué Plan. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;