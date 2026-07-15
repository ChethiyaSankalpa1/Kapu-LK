import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProfileCard from '../../components/ui/ProfileCard';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Users = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await userAPI.getAllUsers();
            // Filter out the current user and admin users
            const filteredUsers = response.data.filter(u => u._id !== currentUser?._id && u.role !== 'admin');
            setUsers(filteredUsers);
        } catch (error) {
            toast.error(t('users.fetchFailed', { defaultValue: 'Failed to fetch users' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const response = await userAPI.searchUsers(filters);
            // Filter out the current user and admin users
            const filteredUsers = response.data.filter(u => u._id !== currentUser?._id && u.role !== 'admin');
            setUsers(filteredUsers);
            toast.success(t('users.profilesFound', { defaultValue: 'Found {{count}} profiles', count: filteredUsers.length }));
        } catch (error) {
            toast.error(t('users.searchFailed', { defaultValue: 'Search failed' }));
        } finally {
            setLoading(false);
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
        fetchUsers();
    };

    // For the browse grid, we show a single View Profile action per card.
    const handleView = (id) => {
        navigate(`/users/${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 sm:py-8 transition-colors duration-300">
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
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-5 sm:p-6 mb-6 transition-all duration-300">
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-5">
                                Refine your match preferences below to find compatible profiles.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Gender */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('auth.gender', { defaultValue: 'Gender' })}
                                    </label>
                                    <select
                                        value={filters.gender}
                                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
                                    >
                                        <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                                        <option value="male">{t('common.male', { defaultValue: 'Male' })}</option>
                                        <option value="female">{t('common.female', { defaultValue: 'Female' })}</option>
                                        <option value="other">{t('common.other', { defaultValue: 'Other' })}</option>
                                    </select>
                                </div>

                                {/* Age Range Grouped */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Min Age</label>
                                        <input
                                            type="number"
                                            value={filters.minAge}
                                            onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
                                        placeholder="Enter religion"
                                    />
                                </div>

                                {/* Marital Status */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                                        {t('users.maritalStatus', { defaultValue: 'Marital Status' })}
                                    </label>
                                    <select
                                        value={filters.maritalStatus}
                                        onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
                                    >
                                        <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                                        <option value="single">{t('users.single', { defaultValue: 'Single' })}</option>
                                        <option value="divorced">{t('users.divorced', { defaultValue: 'Divorced' })}</option>
                                        <option value="widowed">{t('users.widowed', { defaultValue: 'Widowed' })}</option>
                                    </select>
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
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm min-h-[44px]"
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
                                    <RefreshCw className="w-4 h-4 text-gray-550" />
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
                            {users.map((u) => (
                                <ProfileCard
                                    key={u._id}
                                    user={u}
                                    onView={() => handleView(u._id)}
                                    isOwnProfile={false}
                                />
                            ))}
                        </div>
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
