import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { walletAPI, achievementAPI } from '../../services/api';
import moment from 'moment';
import {
    Heart, LogOut, User, Users, LayoutDashboard, Menu, X,
    Sun, Moon, Crown, Globe, ChevronRight, Sparkles, MessageSquare,
    Shield, FileText, Search, Bell, Settings, ChevronDown, BellRing, Wallet, Trophy
} from 'lucide-react';
import PremiumBadge from '../ui/PremiumBadge';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, logout, isAdmin, darkMode, setDarkMode, premiumStatus, language, setLanguage, notifications } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [mobileNavVisible, setMobileNavVisible] = useState(true);
    const [walletBalance, setWalletBalance] = useState(0);
    const [achievementPoints, setAchievementPoints] = useState(0);
    const drawerRef = useRef(null);

    useEffect(() => {
        if (user && !isAdmin) {
            const fetchBalances = async () => {
                try {
                    const [walletRes, statsRes] = await Promise.all([
                        walletAPI.getWallet(),
                        achievementAPI.getMyStats()
                    ]);
                    setWalletBalance(walletRes.data.balance || 0);
                    setAchievementPoints(statsRes.data.stats.points || 0);
                } catch (error) {
                    console.error('Failed to fetch header balances', error);
                }
            };
            fetchBalances();
            
            // Poll every 15s to keep it updated
            const interval = setInterval(fetchBalances, 15000);
            return () => clearInterval(interval);
        }
    }, [user, isAdmin]);
    const searchRef = useRef(null);
    const notifRef = useRef(null);
    const profileRef = useRef(null);
    const lastScrollYRef = useRef(0);

    // Auto-close on navigation
    useEffect(() => { setMobileOpen(false); }, [location.pathname]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.classList.add('sidebar-open');
        } else {
            document.body.classList.remove('sidebar-open');
        }
        return () => document.body.classList.remove('sidebar-open');
    }, [mobileOpen]);

    // Close on outside click / Escape
    useEffect(() => {
        const handleKey = (e) => { 
            if (e.key === 'Escape') {
                setMobileOpen(false);
                setSearchOpen(false);
                setNotifOpen(false);
                setProfileOpen(false);
                setLangOpen(false);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    // Auto-hide mobile bottom navigation on scroll down and show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY || 0;
            const scrollDelta = currentScrollY - lastScrollYRef.current;

            if (Math.abs(scrollDelta) < 8) {
                return;
            }

            if (currentScrollY <= 16) {
                setMobileNavVisible(true);
            } else if (scrollDelta > 0) {
                setMobileNavVisible(false);
            } else {
                setMobileNavVisible(true);
            }

            lastScrollYRef.current = currentScrollY;
        };

        lastScrollYRef.current = window.scrollY || 0;
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileNavVisible(true);
        lastScrollYRef.current = window.scrollY || 0;
    }, [location.pathname]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setProfileOpen(false);
            }
            if (langOpen && !event.target.closest('.lang-dropdown')) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [langOpen]);

    const handleLogout = () => {
        setMobileOpen(false);
        logout();
        navigate('/login');
    };

    const languages = [
        { code: 'en', flag: '🇬🇧', label: 'English' },
        { code: 'si', flag: '🇱🇰', label: 'සිංහල' },
        { code: 'ta', flag: '🇮🇳', label: 'தமிழ்' },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate('/users', { state: { searchQuery } });
            setSearchQuery('');
            setSearchOpen(false);
        }
    };

    const unreadCount = notifications?.filter(n => !n.read).length || 0;

    const isActive = (path) => location.pathname === path;

    /* ---- Sub-components ---- */
    const NavItem = ({ to, icon: Icon, label, badge }) => {
        const active = isActive(to);
        return (
            <Link
                to={to}
                className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-150 group ${
                    active
                        ? 'bg-gradient-to-r from-purple-500/15 to-pink-500/15 dark:from-purple-500/25 dark:to-pink-500/25 text-purple-700 dark:text-purple-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                        active
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600'
                    }`}>
                        <Icon className="w-4.5 h-4.5" size={18} />
                    </div>
                    <span className="text-[15px] font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {badge > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold rounded-full bg-red-500 text-white">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    )}
                    <ChevronRight className={`w-4 h-4 transition-all ${active ? 'text-purple-400 opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />
                </div>
            </Link>
        );
    };

    const LangButton = ({ isMobile = false }) => (
        <div className="relative lang-dropdown">
            <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium text-gray-700 dark:text-gray-200"
                aria-label="Language"
            >
                <Globe className="w-4 h-4" />
                <span className="uppercase text-xs">{language}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
                <div className={`absolute ${isMobile ? 'left-0' : 'right-0'} mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200`}>
                    {languages.map(l => (
                        <button
                            key={l.code}
                            onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                            className={`flex items-center gap-2 w-full px-3 py-2.5 text-sm transition ${
                                language === l.code
                                    ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-semibold'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <span className="text-lg">{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const SearchBar = () => (
        <div ref={searchRef} className="relative">
            <button
                onClick={() => setSearchOpen(v => !v)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300"
                aria-label="Search"
            >
                <Search className="w-5 h-5" />
            </button>
            {searchOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                    <form onSubmit={handleSearch} className="p-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id="navbar-search-input"
                                name="searchQuery"
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search profiles..."
                                aria-label="Search profiles"
                                autoComplete="off"
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchOpen(false)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );

    const NotificationMenu = () => (
        <div ref={notifRef} className="relative">
            <button
                onClick={() => setNotifOpen(v => !v)}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300 relative"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {notifications && notifications.length > 0 ? (
                            notifications.map((notif, index) => (
                                <div
                                    key={index}
                                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                                        !notif.read ? 'bg-purple-50/50 dark:bg-purple-900/10' : ''
                                    }`}
                                >
                                    <p className="text-sm text-gray-900 dark:text-white">{notif.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {moment(notif.createdAt).fromNow()}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <BellRing className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <Link
                            to="/dashboard"
                            onClick={() => setNotifOpen(false)}
                            className="block text-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );

    const ProfileMenu = () => (
        <div ref={profileRef} className="relative">
            <button
                onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Profile menu"
            >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden">
                    {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-white">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                    )}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-2">
                        <Link
                            to="/profile"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                        </Link>
                        <Link
                            to="/settings"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                        <Link
                            to="/premium"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                        >
                            <Crown className="w-4 h-4" />
                            <span>Go Premium</span>
                        </Link>
                    </div>
                    <div className="py-2 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => {
                                setProfileOpen(false);
                                handleLogout();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* ===== TOPBAR ===== */}
            <nav className="glass-nav">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-14 sm:h-16">
                        {/* Logo */}
                        <Link
                            to={user ? (isAdmin ? '/admin' : '/dashboard') : '/'}
                            className="flex items-center gap-2 font-extrabold text-xl sm:text-2xl"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                                <Heart className="w-4.5 h-4.5 text-white" size={18} />
                            </div>
                            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                LoveLK
                            </span>
                            {premiumStatus?.isPremium && <PremiumBadge plan={user?.premiumPlan || premiumStatus?.premiumPlan} size="sm" />}
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <>
                                    {isAdmin ? (
                                        <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/admin') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                            <LayoutDashboard className="w-4 h-4" />
                                            <span>{t('nav.admin')}</span>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link to="/dashboard" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/dashboard') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <LayoutDashboard className="w-4 h-4" />
                                                <span>{t('nav.dashboard')}</span>
                                            </Link>
                                            <Link to="/users" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/users') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <Users className="w-4 h-4" />
                                                <span>{t('nav.browse')}</span>
                                            </Link>
                                            <Link to="/conversation" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/conversation') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <MessageSquare className="w-4 h-4" />
                                                <span>{t('nav.messages')}</span>
                                            </Link>
                                            <Link to="/wallet" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/wallet') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <Crown className="w-4 h-4" />
                                                <span>Wallet & Achievements</span>
                                            </Link>
                                        </>
                                    )}
                                    {user && !isAdmin && (
                                        <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 px-3 py-1.5 rounded-xl border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-semibold text-xs transition duration-150 mr-2 shrink-0">
                                            <Link to="/wallet" className="flex items-center gap-1 hover:opacity-85 transition" title="Wallet Balance">
                                                <Wallet className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                                                <span>Rs. {walletBalance}</span>
                                            </Link>
                                            <span className="text-purple-300/70 dark:text-purple-700/70">|</span>
                                            <Link to="/wallet" className="flex items-center gap-1 hover:opacity-85 transition" title="Achievement Points">
                                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                                <span>{achievementPoints} pts</span>
                                            </Link>
                                        </div>
                                    )}
                                    <SearchBar />
                                    <NotificationMenu />
                                    <ProfileMenu />
                                    <LangButton />
                                    <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">
                                        {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <SearchBar />
                                    <LangButton />
                                    <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">
                                        {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                                    </button>
                                    <Link to="/login" className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition px-3 py-2">
                                        {t('nav.login')}
                                    </Link>
                                    <Link to="/register" className="btn-primary text-sm px-4 py-2.5">
                                        {t('nav.register')}
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile right controls */}
                        <div className="flex md:hidden items-center gap-2">
                            {user && !isAdmin && (
                                <Link to="/wallet" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-bold text-[11px] mr-1" title="Wallet Balance">
                                    <Wallet className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                                    <span>Rs. {walletBalance}</span>
                                </Link>
                            )}
                            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setMobileOpen(true)}
                                aria-label="Open menu"
                                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ===== MOBILE BOTTOM NAVIGATION ===== */}
            {user && !location.pathname.startsWith('/conversation') && (
                <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 shadow-2xl transition-transform duration-300 ease-out ${mobileNavVisible ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="flex items-center justify-around py-2 px-2">
                        <Link
                            to="/dashboard"
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                isActive('/dashboard')
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <LayoutDashboard className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{t('nav.dashboard')}</span>
                        </Link>
                        <Link
                            to="/users"
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                isActive('/users')
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <Users className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{t('nav.browse')}</span>
                        </Link>
                        <Link
                            to="/conversation"
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all relative ${
                                isActive('/conversation')
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <MessageSquare className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{t('nav.messages')}</span>
                        </Link>
                        <Link
                            to="/wallet"
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                isActive('/wallet')
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <Crown className="w-6 h-6" />
                            <span className="text-[10px] font-medium text-center line-clamp-1">Wallet & Rewards</span>
                        </Link>
                        <Link
                            to="/profile"
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                                isActive('/profile')
                                    ? 'text-purple-600 dark:text-purple-400'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{t('nav.profile')}</span>
                        </Link>
                    </div>
                </div>
            )}

            {/* ===== MOBILE OVERLAY ===== */}
            <div
                aria-hidden="true"
                onClick={() => setMobileOpen(false)}
                className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[100] md:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* ===== MOBILE DRAWER ===== */}
            <aside
                ref={drawerRef}
                className={`fixed top-0 right-0 z-[110] h-full mobile-drawer w-[85vw] max-w-[320px] flex flex-col md:hidden
                  bg-white dark:bg-gray-950 shadow-2xl
                  transform transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]
                  ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* === DRAWER HEADER (gradient) === */}
                <div className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-indigo-600 px-5 pt-12 pb-6 overflow-hidden shrink-0">
                    {/* deco blobs */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

                    {/* Close btn */}
                    <button
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close menu"
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* User info */}
                    {user ? (
                        <div className="flex items-center gap-3.5">
                            <div className="w-14 h-14 rounded-2xl bg-white/25 border-2 border-white/40 flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                                {user.profileImageUrl
                                    ? <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                                    : <span className="text-2xl font-bold text-white">{user.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-bold text-lg truncate leading-tight">{user.name}</p>
                                <p className="text-white/70 text-xs mt-0.5">
                                    {isAdmin ? '🛡 Administrator' : premiumStatus?.isPremium ? '✨ Premium Member' : '🌟 Free Account'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                <Heart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg">LoveLK</p>
                                <p className="text-white/70 text-xs">Find your soulmate</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* === SCROLLABLE CONTENT === */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {/* NAV SECTION */}
                    <div className="px-3 pt-4 pb-2">
                        <p className="px-2 pb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Navigation</p>
                        <div className="space-y-0.5">
                            {user ? (
                                isAdmin ? (
                                    <NavItem to="/admin" icon={LayoutDashboard} label={t('nav.admin')} />
                                ) : (
                                    <>
                                        <NavItem to="/dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />
                                        <NavItem to="/users" icon={Users} label={t('nav.browse')} />
                                        <NavItem to="/conversation" icon={MessageSquare} label={t('nav.messages')} />
                                        <NavItem to="/wallet" icon={Crown} label="Wallet & Achievements" />
                                        <NavItem to="/profile" icon={User} label={t('nav.profile')} />
                                        <NavItem to="/settings" icon={Settings} label={t('nav.settings')} />
                                        <NavItem to="/contact-admin" icon={Shield} label={t('nav.contactAdmin')} />
                                        <NavItem to="/privacy-policy" icon={FileText} label={t('nav.privacyPolicy')} />
                                    </>
                                )
                            ) : (
                                <>
                                    <NavItem to="/login" icon={User} label={t('nav.login')} />
                                    <NavItem to="/register" icon={Heart} label={t('nav.register')} />
                                </>
                            )}

                            {/* Go Premium CTA */}
                            {user && !premiumStatus?.isPremium && !isAdmin && (
                                <Link
                                    to="/premium"
                                    className="mt-2 flex items-center gap-3 px-3 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 hover:shadow-md transition group"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
                                        <Sparkles className="w-4.5 h-4.5 text-white" size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Go Premium</p>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-500 truncate">Unlock all features</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <div className="mx-4 my-1 h-px bg-gray-100 dark:bg-gray-800" />

                    {/* SETTINGS SECTION */}
                    <div className="px-3 py-2">
                        <p className="px-2 pb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Settings</p>

                        {/* Dark mode */}
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="flex items-center justify-between w-full px-3 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    {darkMode ? <Sun className="w-4.5 h-4.5 text-yellow-500" size={18} /> : <Moon className="w-4.5 h-4.5 text-gray-500" size={18} />}
                                </div>
                                <span className="text-[15px] font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </div>
                            {/* Toggle pill */}
                            <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${darkMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                            </div>
                        </button>

                        {/* Language */}
                        <div className="px-3 py-3">
                            <div className="flex items-center gap-3 mb-2.5">
                                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Globe className="w-4.5 h-4.5 text-gray-500" size={18} />
                                </div>
                                <span className="text-[15px] font-medium text-gray-600 dark:text-gray-300">Language</span>
                            </div>
                            <div className="flex gap-2 ml-12">
                                {languages.map(l => (
                                    <button
                                        key={l.code}
                                        onClick={() => setLanguage(l.code)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            language === l.code
                                                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    >
                                        {l.flag} {l.code.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* === FOOTER ACTION === */}
                <div className="shrink-0 px-4 py-4 border-t border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950">
                    {user ? (
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition text-[15px]"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{t('nav.logout')}</span>
                        </button>
                    ) : (
                        <>
                            <Link
                                to="/register"
                                className="btn-primary w-full"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>{t('nav.register')}</span>
                            </Link>
                            <div className="mt-3 text-center">
                                <Link to="/privacy-policy" className="text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition">
                                    {t('nav.privacyPolicy')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </aside>
        </>
    );
};

export default Navbar;
