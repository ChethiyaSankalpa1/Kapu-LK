import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI, messageAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import ProfileCard from '../../components/ui/ProfileCard';
import ProfileAvatar from '../../components/ui/ProfileAvatar';
import PremiumBadge from '../../components/ui/PremiumBadge';
import CustomSelect from '../../components/ui/CustomSelect';
import { 
    Filter, RefreshCw, Heart, Sparkles, Flame, LayoutGrid,
    X, RotateCcw, Info, MapPin, Briefcase,
    CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';

const SRI_LANKAN_DISTRICTS = [
    'All Sri Lanka', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
    'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu',
    'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa',
    'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Overseas / Expat'
];

const Users = ({ isMatchesOnly = false }) => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // View Mode: 'swipe' (Tinder/Bumble-style discovery deck) or 'grid' (classic catalog)
    const [viewMode, setViewMode] = useState(searchParams.get('mode') || 'swipe');
    const [swipeIndex, setSwipeIndex] = useState(0);
    const [lastSwiped, setLastSwiped] = useState(null);
    const [matchModalUser, setMatchModalUser] = useState(null);

    const isMatchesMode = isMatchesOnly || searchParams.get('matches') === 'true';

    const initialGender = searchParams.get('gender') || '';
    const initialMinAge = searchParams.get('minAge') || '';
    const initialMaxAge = searchParams.get('maxAge') || '';
    const initialLocation = searchParams.get('location') || searchParams.get('district') || '';
    const initialReligion = searchParams.get('religion') || '';

    const hasInitialSearch = Boolean(initialGender || initialMinAge || initialLocation || initialReligion);

    const [filters, setFilters] = useState({
        gender: initialGender,
        minAge: initialMinAge,
        maxAge: initialMaxAge,
        location: initialLocation,
        religion: initialReligion,
        maritalStatus: searchParams.get('maritalStatus') || '',
        interests: searchParams.get('interests') || '',
        intent: searchParams.get('intent') || '',
    });
    const [showFilters, setShowFilters] = useState(hasInitialSearch);
    const observer = useRef(null);

    // Cleanup observer on unmount
    useEffect(() => {
        return () => observer.current?.disconnect?.();
    }, []);

    const lastUserElementRef = useCallback(node => {
        if (loading || loadingMore || viewMode === 'swipe') return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, loadingMore, hasMore, viewMode]);

    const fetchMatches = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await userAPI.getMatches({ page: pageNum, limit: 16 });
            const filteredUsers = (response.data.data || response.data || []).filter(
                (u) => u._id !== currentUser?._id && u.role !== 'admin'
            );

            setUsers(prev => pageNum === 1 ? filteredUsers : [...prev, ...filteredUsers]);
            setHasMore(response.data.hasMore ?? false);
        } catch (error) {
            toast.error(t('users.matchesFailed', { defaultValue: 'Failed to fetch matches' }));
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [currentUser?._id, t]);

    const fetchUsers = useCallback(async (pageNum = 1) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const response = await userAPI.getAllUsers({ page: pageNum, limit: 16 });
            const filteredUsers = (response.data.data || response.data || []).filter(
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

    const performSearch = useCallback(async () => {
        setLoading(true);
        setSwipeIndex(0);

        try {
            const cleanedFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
            );
            const response = await userAPI.searchUsers(cleanedFilters);
            const filteredUsers = (response.data.data || response.data || []).filter(
                (u) => u._id !== currentUser?._id && u.role !== 'admin'
            );

            setUsers(filteredUsers);
            setHasMore(false);
        } catch (error) {
            toast.error(t('users.searchFailed', { defaultValue: 'Failed to perform search' }));
        } finally {
            setLoading(false);
        }
    }, [filters, currentUser?._id, t]);

    useEffect(() => {
        if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
            setLoading(false);
            return;
        }

        if (hasInitialSearch) {
            performSearch();
            return;
        }

        if (isMatchesMode) {
            fetchMatches(page);
        } else {
            fetchUsers(page);
        }
    }, [page, isMatchesMode, hasInitialSearch, performSearch, fetchMatches, fetchUsers, currentUser]);

    const handleApplyFilters = () => {
        performSearch();
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
            intent: '',
        });
        setSwipeIndex(0);

        if (page !== 1) {
            setPage(1);
        } else {
            fetchUsers(1);
        }
    };

    const handleLike = async (targetUser) => {
        if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
            toast.error('Account approval is required before messaging or liking.');
            return;
        }

        const targetId = typeof targetUser === 'object' ? targetUser._id : targetUser;
        const targetObj = typeof targetUser === 'object' ? targetUser : users.find(u => u._id === targetId);

        try {
            await messageAPI.sendMessage({
                to: targetId,
                content: 'sent you a like on Kapu-LK',
                type: 'like',
            });
            
            // Trigger mutual match notification modal
            if (targetObj) {
                setMatchModalUser(targetObj);
            } else {
                toast.success('Like sent successfully! ❤️');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send like');
        }

        if (viewMode === 'swipe') {
            setLastSwiped({ index: swipeIndex, user: targetObj, action: 'like' });
            setSwipeIndex(prev => prev + 1);
        }
    };

    const handlePass = () => {
        if (swipeIndex < users.length) {
            setLastSwiped({ index: swipeIndex, user: users[swipeIndex], action: 'pass' });
            setSwipeIndex(prev => prev + 1);
        }
    };

    const handleUndo = () => {
        if (lastSwiped && swipeIndex > 0) {
            setSwipeIndex(lastSwiped.index);
            setLastSwiped(null);
            toast.info(`Restored ${lastSwiped.user?.name || 'profile'}`);
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

    // Keyboard support for swipe deck
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (viewMode !== 'swipe' || matchModalUser || showFilters) return;
            if (e.key === 'ArrowLeft') {
                handlePass();
            } else if (e.key === 'ArrowRight' && users[swipeIndex]) {
                handleLike(users[swipeIndex]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, swipeIndex, users, matchModalUser, showFilters]);

    if (!currentUser?.isApproved && currentUser?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Account Under Review</h2>
                    <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
                        For the privacy and protection of all members, an administrator must approve your account before you can browse member profiles or swipe matches.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const currentCard = users[swipeIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-4 pb-24 md:py-8 transition-colors duration-300">
            <div className="container mx-auto px-4 max-w-7xl">
                
                {/* Header Controls Bar */}
                <div className="mb-6">
                    <div className="mb-3">
                        <BackButton label="Back" />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
                                {isMatchesMode ? <Heart className="w-5 h-5 fill-white" /> : <Flame className="w-5 h-5 fill-white" />}
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    {isMatchesMode ? 'My Matches' : 'Discover Connections'}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {isMatchesMode
                                        ? 'Recommended partner profiles based on mutual preferences'
                                        : 'Find genuine Sri Lankan singles ready for meaningful relationships'}
                                </p>
                            </div>
                        </div>

                        {/* Top Right Controls: Swipe/Grid Toggle & Filter Button */}
                        <div className="flex items-center gap-2">
                            {/* Mode Toggle */}
                            <div className="p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('swipe')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        viewMode === 'swipe'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Flame className="w-3.5 h-3.5" />
                                    <span>Swipe</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                    }`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                    <span>Grid</span>
                                </button>
                            </div>

                            {/* Filter Toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs sm:text-sm font-bold transition shadow-xs ${
                                    showFilters
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Drawer / Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 mb-8 animate-in fade-in slide-in-from-top-3">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Refine Discovery Preferences</h3>
                                <p className="text-xs text-slate-500">Target matches tailored to your lifestyle and values</p>
                            </div>
                            <button onClick={() => setShowFilters(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Gender */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Gender
                                </label>
                                <CustomSelect
                                    value={filters.gender}
                                    onChange={(val) => setFilters({ ...filters, gender: val })}
                                    options={[
                                        { value: '', label: 'All Genders' },
                                        { value: 'male', label: 'Male' },
                                        { value: 'female', label: 'Female' },
                                        { value: 'other', label: 'Other' }
                                    ]}
                                />
                            </div>

                            {/* Age Range */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Min Age</label>
                                    <input
                                        type="number"
                                        value={filters.minAge}
                                        onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                        placeholder="18"
                                        min="18"
                                        max="100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Max Age</label>
                                    <input
                                        type="number"
                                        value={filters.maxAge}
                                        onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                                        placeholder="50"
                                        min="18"
                                        max="100"
                                    />
                                </div>
                            </div>

                            {/* District */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    District / Location
                                </label>
                                <select
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold outline-none"
                                >
                                    <option value="">Any District</option>
                                    {SRI_LANKAN_DISTRICTS.filter(d => d !== 'All Sri Lanka').map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Marital Status */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                    Relationship Status
                                </label>
                                <CustomSelect
                                    value={filters.maritalStatus}
                                    onChange={(val) => setFilters({ ...filters, maritalStatus: val })}
                                    options={[
                                        { value: '', label: 'Any Status' },
                                        { value: 'single', label: 'Never Married / Single' },
                                        { value: 'divorced', label: 'Divorced' },
                                        { value: 'widowed', label: 'Widowed' }
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reset</span>
                            </button>

                            <button
                                onClick={handleApplyFilters}
                                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
                            >
                                Apply Preferences
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {loading ? (
                    <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-lg mx-auto">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-rose-600 mx-auto mb-4"></div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Discovering compatible members...</p>
                        <p className="text-xs text-slate-400 mt-1">Reviewing verified profiles in Sri Lanka</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs max-w-md mx-auto p-8">
                        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">No Profiles Found</h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                            {isMatchesMode
                                ? 'No direct matches found matching your current preference filters.'
                                : 'Try broadening your age or district filters to discover more connections.'}
                        </p>
                        <button
                            onClick={handleReset}
                            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
                        >
                            Reset Filters
                        </button>
                    </div>
                ) : viewMode === 'swipe' ? (
                    
                    /* ================= SWIPE DISCOVERY CARD DECK ================= */
                    <div className="max-w-md mx-auto">
                        {currentCard ? (
                            <div className="space-y-4">
                                {/* Card */}
                                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-rose-950/20 transition-all duration-300">
                                    
                                    {/* Large Photo Section */}
                                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-900">
                                        <ProfileAvatar
                                            user={currentCard}
                                            className="h-full w-full"
                                            imageClassName="h-full w-full object-cover object-center"
                                            avatarClassName="text-8xl"
                                            fallbackClassName="text-5xl font-black text-white bg-gradient-to-tr from-rose-600 to-pink-500"
                                        />

                                        {/* Multi-layered dark gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30 pointer-events-none" />

                                        {/* Top Badges */}
                                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                            {(currentCard.isPremium || currentCard.role === 'admin') ? (
                                                <PremiumBadge plan={currentCard.premiumPlan} isAdmin={currentCard.role === 'admin'} size="sm" />
                                            ) : (
                                                <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white border border-white/20">
                                                    Member
                                                </div>
                                            )}

                                            {currentCard.isApproved && (
                                                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-extrabold shadow-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 fill-white text-rose-600" />
                                                    <span>Verified</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Info Overlay */}
                                        <div className="absolute bottom-5 left-5 right-5 text-white space-y-2 pointer-events-auto">
                                            <div className="flex items-baseline justify-between">
                                                <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                                                    {currentCard.name || 'Member'}, {currentCard.age || '25'}
                                                </h2>
                                            </div>

                                            <p className="text-xs text-rose-200 flex items-center gap-1 font-semibold">
                                                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                                <span>{currentCard.district || currentCard.location || 'Sri Lanka'}</span>
                                                {currentCard.maritalStatus && <span>• {currentCard.maritalStatus}</span>}
                                            </p>

                                            {(currentCard.occupation || currentCard.education) && (
                                                <p className="text-xs text-slate-200 flex items-center gap-1">
                                                    <Briefcase className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                                    <span className="truncate">{currentCard.occupation || currentCard.education}</span>
                                                </p>
                                            )}

                                            {currentCard.bio && (
                                                <p className="text-xs text-slate-300 line-clamp-2 italic pt-1 border-t border-white/15">
                                                    "{currentCard.bio}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Bar (Pass, Undo, Info, Like) */}
                                    <div className="p-4 sm:p-5 flex items-center justify-around bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                                        {/* Undo button */}
                                        <button
                                            type="button"
                                            onClick={handleUndo}
                                            disabled={!lastSwiped}
                                            title="Undo last swipe"
                                            className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-500 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition active:scale-90 shadow-sm"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                        </button>

                                        {/* Pass button */}
                                        <button
                                            type="button"
                                            onClick={handlePass}
                                            title="Pass (Left arrow)"
                                            className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 flex items-center justify-center transition active:scale-90 shadow-md"
                                        >
                                            <X className="w-8 h-8 stroke-[2.5]" />
                                        </button>

                                        {/* View Details button */}
                                        <button
                                            type="button"
                                            onClick={() => handleView(currentCard._id)}
                                            title="View Full Profile"
                                            className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-500 flex items-center justify-center transition active:scale-90 shadow-sm"
                                        >
                                            <Info className="w-5 h-5" />
                                        </button>

                                        {/* Like button */}
                                        <button
                                            type="button"
                                            onClick={() => handleLike(currentCard)}
                                            title="Like & Connect (Right arrow)"
                                            className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white flex items-center justify-center transition active:scale-90 shadow-lg shadow-rose-600/30"
                                        >
                                            <Heart className="w-8 h-8 fill-white" />
                                        </button>
                                    </div>
                                </div>

                                {/* Deck counter & Hint */}
                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-3">
                                    <span>Profile {swipeIndex + 1} of {users.length}</span>
                                    <span>Tip: Use ← Left to pass, → Right to like</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
                                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">You're All Caught Up!</h3>
                                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                                    You have reviewed all available profiles for your current filters. Switch to Grid view or adjust your preferences to meet more members.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                    <button
                                        onClick={() => setSwipeIndex(0)}
                                        className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                                    >
                                        Review Deck Again
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
                                    >
                                        Switch to Grid View
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                ) : (

                    /* ================= GRID BROWSE VIEW ================= */
                    <>
                        <div className="flex items-center justify-between mb-5">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-rose-600" />
                                <span>Found {users.length} active member profiles</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                            {users.map((u, index) => {
                                const isLast = users.length === index + 1;
                                return (
                                    <div ref={isLast ? lastUserElementRef : null} key={u._id}>
                                        <ProfileCard
                                            user={u}
                                            onView={() => handleView(u._id)}
                                            onMessage={() => handleMessage(u._id)}
                                            onLike={() => handleLike(u)}
                                            isOwnProfile={false}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {loadingMore && (
                            <div className="text-center py-6 mt-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-600 mx-auto"></div>
                            </div>
                        )}
                    </>
                )}

            </div>

            {/* MUTUAL MATCH CELEBRATION MODAL */}
            {matchModalUser && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center border border-rose-200 dark:border-rose-900/60 shadow-2xl space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-600/40 animate-bounce">
                            <Heart className="w-8 h-8 fill-white" />
                        </div>

                        <div>
                            <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-widest">
                                Connection Started
                            </span>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                You Liked {matchModalUser.name}!
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                A notification was sent to {matchModalUser.name}. When they like you back, you'll be able to chat freely.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    const uId = matchModalUser._id;
                                    setMatchModalUser(null);
                                    handleMessage(uId);
                                }}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-md hover:from-rose-500 hover:to-pink-500 transition"
                            >
                                Send a Message Now
                            </button>

                            <button
                                onClick={() => setMatchModalUser(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                Keep Discovering
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Users;
