import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';
import { LayoutDashboard, Search, Heart, MessageSquare, User, LogIn, Users } from 'lucide-react';

const MobileBottomNav = () => {
    const { t } = useTranslation();
    const { user, isAdmin } = useAuth();
    const location = useLocation();
    const [unreadMessages, setUnreadMessages] = useState(0);

    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Detect virtual keyboard and input focus on mobile to prevent bottom dock jumping up
    useEffect(() => {
        const handleFocusIn = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) {
                setIsKeyboardOpen(true);
            }
        };

        const handleFocusOut = () => {
            // Small timeout to prevent flickering between input focus changes
            setTimeout(() => {
                const activeTag = document.activeElement?.tagName?.toLowerCase();
                if (activeTag !== 'input' && activeTag !== 'textarea' && !document.activeElement?.isContentEditable) {
                    setIsKeyboardOpen(false);
                }
            }, 100);
        };

        window.addEventListener('focusin', handleFocusIn);
        window.addEventListener('focusout', handleFocusOut);

        const handleResize = () => {
            if (window.visualViewport) {
                const isKeyboard = (window.innerHeight - window.visualViewport.height) > 60;
                if (isKeyboard) {
                    setIsKeyboardOpen(true);
                }
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('focusin', handleFocusIn);
            window.removeEventListener('focusout', handleFocusOut);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Fetch unread count for conversations if logged in
    useEffect(() => {
        if (!user) return;

        const checkUnread = async () => {
            try {
                const res = await messageAPI.getConversations();
                const convs = res.data || [];
                const totalUnread = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
                setUnreadMessages(totalUnread);
            } catch (err) {
                // silent
            }
        };

        checkUnread();
        const timer = setInterval(checkUnread, 20000);
        return () => clearInterval(timer);
    }, [user]);

    // Hide on admin portal, or when mobile keyboard is open
    if (isAdmin || location.pathname.startsWith('/admin') || isKeyboardOpen) {
        return null;
    }

    const checkIsActive = (to) => {
        if (to === '/dashboard') {
            return location.pathname === '/dashboard' || location.pathname === '/';
        }
        if (to === '/users') {
            return (location.pathname === '/users' || location.pathname === '/browse') && location.pathname !== '/matches';
        }
        if (to === '/matches') {
            return location.pathname.startsWith('/matches');
        }
        if (to === '/conversation') {
            return location.pathname.startsWith('/conversation') || location.pathname.startsWith('/messages');
        }
        if (to === '/profile') {
            return location.pathname.startsWith('/profile') || location.pathname.startsWith('/settings');
        }
        return false;
    };

    const navItems = user
        ? [
              {
                  to: '/dashboard',
                  label: t('nav.dashboard', { defaultValue: 'Dashboard' }),
                  icon: LayoutDashboard,
              },
              {
                  to: '/users',
                  label: t('nav.browse', { defaultValue: 'Browse' }),
                  icon: Search,
              },
              {
                  to: '/matches',
                  label: t('nav.matches', { defaultValue: 'Matches' }),
                  icon: Heart,
              },
              {
                  to: '/conversation',
                  label: t('nav.messages', { defaultValue: 'Messages' }),
                  icon: MessageSquare,
                  badge: unreadMessages,
              },
              {
                  to: '/profile',
                  label: t('nav.profile', { defaultValue: 'Profile' }),
                  icon: User,
              },
          ]
        : [
              {
                  to: '/',
                  label: t('nav.home', { defaultValue: 'Home' }),
                  icon: LayoutDashboard,
                  matchExact: true,
              },
              {
                  to: '/login',
                  label: t('nav.login', { defaultValue: 'Sign In' }),
                  icon: LogIn,
              },
              {
                  to: '/register',
                  label: t('nav.register', { defaultValue: 'Join Free' }),
                  icon: Users,
                  highlight: true,
              },
          ];

    return (
        <aside 
            aria-label="Mobile Navigation Dock"
            className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none"
        >
            <div className="max-w-lg mx-auto px-2 sm:px-4 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] pt-1 pointer-events-auto">
                <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl px-1 py-1 flex items-center justify-around">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = user 
                            ? checkIsActive(item.to) 
                            : (item.matchExact ? location.pathname === item.to : location.pathname.startsWith(item.to));

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active:scale-95 min-w-[54px] ${
                                    item.highlight
                                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-purple-500/30 font-bold'
                                        : isActive
                                        ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50/90 dark:bg-purple-950/60'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium'
                                }`}
                            >
                                <div className="relative">
                                    <Icon className={`w-4.5 h-4.5 ${isActive && !item.highlight ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                                    {Boolean(item.badge && item.badge > 0) && (
                                        <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold px-1 min-w-[15px] h-3.5 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] mt-0.5 tracking-tight leading-none">
                                    {item.label}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
};

export default MobileBottomNav;
