import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProfileCard from '../../components/ui/ProfileCard';
import { Search, Filter } from 'lucide-react';
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
            // Filter out the current user
            const filteredUsers = response.data.filter(u => u._id !== currentUser?._id);
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
            // Filter out the current user
            const filteredUsers = response.data.filter(u => u._id !== currentUser?._id);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('nav.browse', { defaultValue: 'Browse Profiles' })}</h1>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center space-x-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow hover:shadow-md transition"
                    >
                        <Filter className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        <span className="text-gray-700 dark:text-gray-300">{showFilters ? t('users.hideFilters', { defaultValue: 'Hide Filters' }) : t('users.showFilters', { defaultValue: 'Show Filters' })}</span>
                    </button>

                    {/* Filters */}
                    {showFilters && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.gender', { defaultValue: 'Gender' })}</label>
                                    <select
                                        value={filters.gender}
                                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                                        <option value="male">{t('common.male', { defaultValue: 'Male' })}</option>
                                        <option value="female">{t('common.female', { defaultValue: 'Female' })}</option>
                                        <option value="other">{t('common.other', { defaultValue: 'Other' })}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Age</label>
                                    <input
                                        type="number"
                                        value={filters.minAge}
                                        onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="18"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Age</label>
                                    <input
                                        type="number"
                                        value={filters.maxAge}
                                        onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.location', { defaultValue: 'Location' })}</label>
                                    <input
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Enter location"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.religion', { defaultValue: 'Religion' })}</label>
                                    <input
                                        type="text"
                                        value={filters.religion}
                                        onChange={(e) => setFilters({ ...filters, religion: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Enter religion"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('users.maritalStatus', { defaultValue: 'Marital Status' })}</label>
                                    <select
                                        value={filters.maritalStatus}
                                        onChange={(e) => setFilters({ ...filters, maritalStatus: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                                        <option value="single">{t('users.single', { defaultValue: 'Single' })}</option>
                                        <option value="divorced">{t('users.divorced', { defaultValue: 'Divorced' })}</option>
                                        <option value="widowed">{t('users.widowed', { defaultValue: 'Widowed' })}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.interests')}</label>
                                    <input
                                        type="text"
                                        value={filters.interests}
                                        onChange={(e) => setFilters({ ...filters, interests: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="e.g. music, travel"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4 mt-4">
                                <button
                                    onClick={handleSearch}
                                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition flex items-center justify-center space-x-2"
                                >
                                    <Search className="w-5 h-5" />
                                    <span>{t('common.search')}</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                                >
                                    {t('users.reset', { defaultValue: 'Reset' })}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
                    </div>
                ) : users.length > 0 ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('users.profilesFound', { defaultValue: 'Found {{count}} profiles', count: users.length })}</p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-600 dark:text-gray-300">{t('users.noResults', { defaultValue: 'No profiles found matching your criteria.' })}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
