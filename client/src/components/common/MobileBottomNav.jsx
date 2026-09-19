import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { messageAPI } from '../../services/api';
import { Heart, Search, Users, MessageSquare, User, LogIn, Crown } from 'lucide-react';

const MobileBottomNav = () => {
    const { t } = useTranslation();
    const { user, isAdmin } = useAuth();
    const location = useLocation();
    const [unreadMessages, setUnreadMessages] = useState(0);

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

    // Hide on admin portal or active 1-on-1 chat conversation so composer is not covered
    const isChatOpen =
        (location.pathname.startsWith('/conversation/') && location.pathname.length > '/conversation/'.length) ||
        (location.pathname.startsWith('/messages/') && location.pathname.length > '/messages/'.length);

    if (isAdmin || location.pathname.startsWith('/admin') || isChatOpen) {
        return null;
    }

    const navItems = user
        ? [
              {
                  to: '/dashboard',
                  label: t('nav.dashboard', { defaultValue: 'Dashboard' }),
                  icon: Heart,
                  matchExact: true,
              },
              {
                  to: '/users',
                  label: t('nav.browse', { defaultValue: 'Browse' }),
                  icon: Search,
              },
              {
                  to: '/conversation',
                  label: t('nav.messages', { defaultValue: 'Messages' }),
                  icon: MessageSquare,
                  badge: unreadMessages,
              },
              {
                  to: '/premium',
                  label: t('nav.walletRewards', { defaultValue: 'Wallet & Rewards' }),
                  icon: Crown,
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
                  icon: Heart,
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
            className="fixed bottom-3 inset-x-3 sm:left-1/2 sm:-translate-x-1/2 z-40 sm:max-w-md md:hidden pointer-events-auto"
        >
            <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-250/70 dark:border-gray-800/80 shadow-[0_12px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] rounded-2xl px-2 py-1.5 flex items-center justify-around">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.matchExact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-90 ${
                                item.highlight
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-purple-500/30'
                                    : isActive
                                    ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${isActive && !item.highlight ? 'stroke-[2.5]' : 'stroke-2'}`} />
                                {Boolean(item.badge && item.badge > 0) && (
                                    <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
};

export default MobileBottomNav;
