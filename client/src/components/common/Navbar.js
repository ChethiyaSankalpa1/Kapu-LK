import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Heart, LogOut, User, Users, LayoutDashboard, Menu, X, Sun, Moon, Crown, Globe } from 'lucide-react';

const Navbar = () => {
    const { t } = useTranslation();
    const { user, logout, isAdmin, darkMode, setDarkMode, premiumStatus, language, setLanguage } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const languages = [
        { code: 'en', name: t('language.en') },
        { code: 'si', name: t('language.si') },
        { code: 'ta', name: t('language.ta') },
    ];

    return (
        <nav className="glass sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <Link to={user ? (isAdmin ? "/admin" : "/dashboard") : "/"} className="flex items-center space-x-2 font-bold text-2xl">
                        <Heart className="w-8 h-8 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent" />
                        <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            LoveLK
                        </span>
                        {premiumStatus?.isPremium && (
                            <Crown className="w-4 h-4 text-yellow-500 ml-1" />
                        )}
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                {isAdmin ? (
                                    <Link to="/admin" className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition font-medium">
                                        <LayoutDashboard className="w-5 h-5" />
                                        <span>{t('nav.admin')}</span>
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/dashboard" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium">
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span>{t('nav.dashboard')}</span>
                                        </Link>

                                        <Link to="/users" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium">
                                            <Users className="w-5 h-5" />
                                            <span>{t('nav.browse', { defaultValue: 'Browse' })}</span>
                                        </Link>

                                        <Link to="/profile" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium">
                                            <User className="w-5 h-5" />
                                            <span>{user.name}</span>
                                        </Link>
                                    </>
                                )}

                                {/* Language switcher */}
                                <div className="relative">
                                    <button
                                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-1"
                                    >
                                        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {language.toUpperCase()}
                                        </span>
                                    </button>
                                    {langMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-32 glass-card rounded-lg shadow-lg py-1 z-50">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setLanguage(lang.code);
                                                        setLangMenuOpen(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${language === lang.code
                                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {lang.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Dark mode toggle */}
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition font-medium"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>{t('nav.logout')}</span>
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Language switcher for guests */}
                                <div className="relative">
                                    <button
                                        onClick={() => setLangMenuOpen(!langMenuOpen)}
                                        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center space-x-1"
                                    >
                                        <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {language.toUpperCase()}
                                        </span>
                                    </button>
                                    {langMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-32 glass-card rounded-lg shadow-lg py-1 z-50">
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setLanguage(lang.code);
                                                        setLangMenuOpen(false);
                                                    }}
                                                    className={`block w-full text-left px-4 py-2 text-sm ${language === lang.code
                                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        }`}
                                                >
                                                    {lang.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                >
                                    {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                                </button>
                                <Link to="/login" className="text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 transition font-medium">
                                    {t('nav.login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile button */}
                    <div className="flex items-center space-x-2 md:hidden">
                        {/* Mobile language switcher */}
                        <div className="relative">
                            <button
                                onClick={() => setLangMenuOpen(!langMenuOpen)}
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                            >
                                <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </button>
                            {langMenuOpen && (
                                <div className="absolute right-0 mt-2 w-32 glass-card rounded-lg shadow-lg py-1 z-50">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setLangMenuOpen(false);
                                            }}
                                            className={`block w-full text-left px-4 py-2 text-sm ${language === lang.code
                                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300'
                                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                        >
                            {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                        </button>
                        <button
                            type="button"
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => setMobileOpen((v) => !v)}
                            aria-label="Toggle menu"
                        >
                            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-3">
                        <div className="flex flex-col space-y-3">
                            {user ? (
                                <>
                                    {isAdmin ? (
                                        <Link onClick={() => setMobileOpen(false)} to="/admin" className="flex items-center space-x-2 text-purple-600 font-medium">
                                            <LayoutDashboard className="w-5 h-5" />
                                            <span>{t('nav.admin')}</span>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link onClick={() => setMobileOpen(false)} to="/dashboard" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-medium">
                                                <LayoutDashboard className="w-5 h-5" />
                                                <span>{t('nav.dashboard')}</span>
                                            </Link>
                                            <Link onClick={() => setMobileOpen(false)} to="/users" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-medium">
                                                <Users className="w-5 h-5" />
                                                <span>{t('nav.browse', { defaultValue: 'Browse' })}</span>
                                            </Link>
                                            <Link onClick={() => setMobileOpen(false)} to="/profile" className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-medium">
                                                <User className="w-5 h-5" />
                                                <span>{user.name}</span>
                                            </Link>
                                        </>
                                    )}
                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            handleLogout();
                                        }}
                                        className="flex items-center space-x-2 text-red-600 font-medium"
                                    >
                                        <LogOut className="w-5 h-5" />
                                        <span>{t('nav.logout')}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link onClick={() => setMobileOpen(false)} to="/login" className="text-gray-700 dark:text-gray-200 font-medium">
                                        {t('nav.login')}
                                    </Link>
                                    <Link onClick={() => setMobileOpen(false)} to="/register" className="btn-primary text-center">
                                        {t('nav.register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
