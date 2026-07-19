import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
    Heart, LogOut, User, Users, LayoutDashboard, Menu, X,
    Sun, Moon, Crown, Globe, ChevronRight, Sparkles, MessageSquare,
    Shield
} from 'lucide-react';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, logout, isAdmin, darkMode, setDarkMode, premiumStatus, language, setLanguage } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const drawerRef = useRef(null);

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
        const handleKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

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
        <div className="relative">
            <button
                onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium text-gray-700 dark:text-gray-200"
                aria-label="Language"
            >
                <Globe className="w-4 h-4" />
                <span className="uppercase text-xs">{language}</span>
            </button>
            {langOpen && (
                <div className={`absolute ${isMobile ? 'left-0' : 'right-0'} mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-[200]`}>
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
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
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
                            {premiumStatus?.isPremium && <Crown className="w-4 h-4 text-yellow-500" />}
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-3">
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
                                                <span>Browse</span>
                                            </Link>
                                            <Link to="/conversation" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/conversation') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <MessageSquare className="w-4 h-4" />
                                                <span>Messages</span>
                                            </Link>
                                            <Link to="/contact-admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/contact-admin') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <Shield className="w-4 h-4" />
                                                <span>Contact Admin</span>
                                            </Link>
                                            <Link to="/profile" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive('/profile') ? 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400' : 'text-gray-700 dark:text-gray-200 hover:text-purple-600 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <User className="w-4 h-4" />
                                                <span className="max-w-[120px] truncate">{user.name}</span>
                                            </Link>
                                        </>
                                    )}
                                    <LangButton />
                                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">
                                        {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
                                    </button>
                                    <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                                        <LogOut className="w-4 h-4" />
                                        <span>{t('nav.logout')}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <LangButton />
                                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-600 dark:text-gray-300">
                                        {darkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4" />}
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
                                        <NavItem to="/users" icon={Users} label="Browse Profiles" />
                                        <NavItem to="/conversation" icon={MessageSquare} label="Messages" />
                                        <NavItem to="/profile" icon={User} label="My Profile" />
                                        <NavItem to="/contact-admin" icon={Shield} label="Contact Admin" />
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
                                    Privacy Policy
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
