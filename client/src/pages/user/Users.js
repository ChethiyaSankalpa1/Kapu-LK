import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProfileCard from '../../components/ui/ProfileCard';
import CustomSelect from '../../components/ui/CustomSelect';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Users = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const [filters, setFilters] = useState({
        gender: '',
        minAge: '',
        maxAge: '',
        location: '',
        religion: '',
        maritalStatus: '',
        interests: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    const observer = useRef(null);

    // Cleanup observer on unmount (prevents leaks)
    useEffect(() => {
        return () => observer.current?.disconnect?.();
    }, []);

    const lastUserElementRef = useCallback(node => {
        if (loading || loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore]);

    const fetchUsers = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await userAPI.getAllUsers({ page: pageNum, limit: 12 });
            const filteredUsers = (response.data.data || response.data).filter(
                (u) => u._id !== currentUser?._id && u.role !== 'admin'
            );

            setUsers(prev => pageNum === 1 ? filteredUsers : [...prev, ...filteredUsers]);
            setHasMore(response.data.hasMore ?? false);
        } catch (error) {
            toast.error(t('users.fetchFailed', { defaultValue: 'Failed to fetch users' }));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentUser?._id, t]);

    const fetchSearchResults = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await userAPI.searchUsers({ ...filters, page: pageNum, limit: 12 });
            const filteredUsers = (response.data.data || response.data).filter(
                (u) => u._id !== currentUser?._id && u.role !== 'admin'
            );

            setUsers(prev => pageNum === 1 ? filteredUsers : [...prev, ...filteredUsers]);
            setHasMore(response.data.hasMore ?? false);
            if (pageNum === 1) {
                toast.success(t('users.profilesFound', { defaultValue: 'Found {{count}} profiles', count: response.data.totalCount || filteredUsers.length }));
            }
        } catch (error) {
            toast.error(t('users.searchFailed', { defaultValue: 'Search failed' }));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentUser?._id, filters, t]);

    useEffect(() => {
        if (isSearching) {
            fetchSearchResults(page);
        } else {
            fetchUsers(page);
        }
    }, [page, isSearching, fetchSearchResults, fetchUsers]);

    const handleSearch = () => {
        setIsSearching(true);
        setHasMore(true);

        // If already on page 1, trigger fetch directly (otherwise useEffect will run)
        if (page !== 1) {
            setPage(1);
        } else {
            fetchSearchResults(1);
        }
    };

    const handleReset = () => {
        setFilters({
            gender: '',
            minAge: '',
            maxAge: '',
            location: '',
            religion: '',
            maritalStatus: '',
            interests: '',
        });
        setIsSearching(false);
        setHasMore(true);

        // If already on page 1, trigger fetch directly (otherwise useEffect will run)
        if (page !== 1) {
            setPage(1);
        } else {
            fetchUsers(1);
        }
    };

    const handleView = (id) => {
        if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
            toast.error('Account approval is required before viewing member profiles.');
            return;
        }
        navigate(`/users/${id}`);
    };

    const handleMessage = (id) => {
        if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
            toast.error('Account approval is required before messaging.');
            return;
        }
        navigate(`/conversation/${id}`);
    };

    if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-250/30">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-amber-500">🔒</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Approval Required</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Your account has not yet been approved by an administrator. You must wait for account approval before you can browse, search, or view other member profiles.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary w-full py-3"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-6 pb-24 md:py-8 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {t('nav.browse', { defaultValue: 'Browse Profiles' })}
                        </h1>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-semibold ${
                                showFilters
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/25'
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/60 shadow-sm'
                            }`}
                            aria-expanded={showFilters}
                        >
                            <Filter className="w-4 h-4 animate-pulse" />
                            <span>{showFilters ? t('users.hideFilters', { defaultValue: 'Hide Filters' }) : t('users.showFilters', { defaultValue: 'Filter Profiles' })}</span>
                        </button>
                    </div>

                    {/* Redesigned Premium Filters Container */}
                    {showFilters && (
                        <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-white/40 dark:border-gray-700/50 p-5 sm:p-6 mb-6 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5 font-medium">
                                Refine your match preferences below to find compatible profiles.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Gender */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('auth.gender', { defaultValue: 'Gender' })}
                                    </label>
                                    <CustomSelect
                                        value={filters.gender}
                                        onChange={(val) => setFilters({ ...filters, gender: val })}
                                        options={[
                                            { value: '', label: t('common.all', { defaultValue: 'All' }) },
                                            { value: 'male', label: t('common.male', { defaultValue: 'Male' }) },
                                            { value: 'female', label: t('common.female', { defaultValue: 'Female' }) },
                                            { value: 'other', label: t('common.other', { defaultValue: 'Other' }) }
                                        ]}
                                    />
                                </div>

                                {/* Age Range Grouped */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Min Age</label>
                                        <input
                                            type="number"
                                            value={filters.minAge}
                                            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                                            className="form-input"
                                            placeholder="18"
                                            min="18"
                                            max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Max Age</label>
                                        <input
                                            type="number"
                                            value={filters.maxAge}
                                            onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                                            className="form-input"
                                            placeholder="50"
                                            min="18"
                                            max="100"
                                        />
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('users.location', { defaultValue: 'Location' })}
                                    </label>
                                    <input
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter city or district"
                                    />
                                </div>

                                {/* Religion */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('users.religion', { defaultValue: 'Religion' })}
                                    </label>
                                    <input
                                        type="text"
                                        value={filters.religion}
                                        onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                                        className="form-input"
                                        placeholder="Enter religion"
                                    />
                                </div>

                                {/* Marital Status */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('users.maritalStatus', { defaultValue: 'Marital Status' })}
                                    </label>
                                    <CustomSelect
                                        value={filters.maritalStatus}
                                        onChange={(val) => setFilters({ ...filters, maritalStatus: val })}
                                        options={[
                                            { value: '', label: t('common.all', { defaultValue: 'All' }) },
                                            { value: 'single', label: t('users.single', { defaultValue: 'Single' }) },
                                            { value: 'divorced', label: t('users.divorced', { defaultValue: 'Divorced' }) },
                                            { value: 'widowed', label: t('users.widowed', { defaultValue: 'Widowed' }) }
                                        ]}
                                    />
                                </div>

                                {/* Interests */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('profile.interests')}
                                    </label>
                                    <input
                                        type="text"
                                        value={filters.interests}
                                        onChange={(e) => setFilters({ ...filters, interests: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g. music, travel"
                                    />
                                </div>
                            </div>

                            {/* Actions Grouped in a clean Flex layout */}
                            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-750">
                                <button
                                    onClick={handleSearch}
                                    className="flex-1 btn-primary text-sm py-2.5"
                                >
                                    <Search className="w-4 h-4" />
                                    <span>{t('common.search', { defaultValue: 'Search' })}</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 btn-secondary text-sm py-2.5"
                                >
                                    <RefreshCw className="w-4 h-4 text-gray-500" />
                                    <span>{t('users.reset', { defaultValue: 'Reset' })}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-1.5">
                            <span>🔍</span>
                            <span>{t('users.profilesFound', { defaultValue: 'Found {{count}} profiles', count: users.length })}</span>
                        </p>
                        {/* Perfect Responsive Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {users.map((u, index) => {
                                if (users.length === index + 1) {
                                    return (
                                        <div ref={lastUserElementRef} key={u._id}>
                                            <ProfileCard
                                                user={u}
                                                onView={() => handleView(u._id)}
                                                onMessage={() => handleMessage(u._id)}
                                                isOwnProfile={false}
                                            />
                                        </div>
                                    );
                                } else {
                                    return (
                                        <ProfileCard
                                            key={u._id}
                                            user={u}
                                            onView={() => handleView(u._id)}
                                            onMessage={() => handleMessage(u._id)}
                                            isOwnProfile={false}
                                        />
                                    );
                                }
                            })}
                        </div>
                        {loadingMore && (
                            <div className="text-center py-6 mt-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                        <p className="text-gray-600 dark:text-gray-300 text-sm">{t('users.noResults', { defaultValue: 'No profiles found matching your criteria.' })}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
