import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { User, Upload, Save, ArrowLeft, ArrowRight } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const location = useLocation();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        profileName: user?.profileName || '',
        phoneNumber: user?.phoneNumber || '',
        age: user?.age || '',
        gender: user?.gender || 'male',
        bio: user?.bio || '',
        interests: user?.interests || '',
        hobbies: user?.hobbies || '',
        location: user?.location || '',
        education: user?.education || '',
        occupation: user?.occupation || '',
        workplace: user?.workplace || '',
        religion: user?.religion || '',
        maritalStatus: user?.maritalStatus || 'single',
        height: user?.height || '',
        weight: user?.weight || '',
        figure: user?.figure || '',
        bodyType: user?.bodyType || '',
        appearance: user?.appearance || '',
        complexion: user?.complexion || '',
        status: user?.status || '',
        ethnicity: user?.ethnicity || '',
        caste: user?.caste || '',
        socialClass: user?.socialClass || '',
        residency: user?.residency || '',
        district: user?.district || '',
        family: user?.family || '',
        smoking: user?.smoking || '',
        drinking: user?.drinking || '',
        children: user?.children || '',
        personality: user?.personality || '',
        firstDatePreference: user?.firstDatePreference || '',
        livingArrangements: user?.livingArrangements || '',
        partnerPreferences: user?.partnerPreferences || {},
    });
    const [preview, setPreview] = useState(user?.profileImageUrl || '');
    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [tab, setTab] = useState('about');
    const steps = ['about', 'religion', 'family', 'lifestyle', 'partner'];
    const currentIndex = steps.indexOf(tab);

    useEffect(() => {
        if (location.state && location.state.reason === 'complete_profile') {
            toast.info('Please complete your profile to access other profiles.');
        }
    }, [location.state]);

    const onChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'phoneNumber' ? value.replace(/\D/g, '') : value,
        });
    };

    const onPrefChange = (e) => {
        setFormData({
            ...formData,
            partnerPreferences: {
                ...(formData.partnerPreferences || {}),
                [e.target.name]: e.target.value,
            },
        });
    };

    const missing = {
        age: !formData.age,
        gender: !formData.gender,
        locOrDistrict: !(formData.district || formData.location),
        education: !(formData.education || '').length,
        occupationOrWorkplace: !(formData.occupation || formData.workplace),
        maritalStatus: !(formData.maritalStatus || '').length,
        religion: !(formData.religion || '').length,
        bio: !((formData.bio || '').trim().length),
        partnerMinAge: !formData.partnerPreferences?.minAge,
        partnerMaxAge: !formData.partnerPreferences?.maxAge,
        partnerReligion: !(formData.partnerPreferences?.religion || '').length,
        partnerDistrict: !(formData.partnerPreferences?.district || '').length,
        partnerEducation: !(formData.partnerPreferences?.education || '').length,
        partnerMaritalStatus: !(formData.partnerPreferences?.maritalStatus || '').length,
    };

    const onFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error(t('toast.profile.invalidFileType'));
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(t('toast.profile.fileTooLarge'));
                return;
            }

            setPreview(URL.createObjectURL(file));

            // Auto-upload immediately
            const formDataImg = new FormData();
            formDataImg.append('profileImage', file);
            setUploadingImage(true);

            try {
                const response = await authAPI.uploadProfileImage(formDataImg);
                updateUser({ ...user, profileImageUrl: response.data.profileImageUrl });
                toast.success(t('toast.profile.photoUploadSuccess'));
            } catch (error) {
                console.error('Image upload error:', error);
                if (error.response?.status === 401) {
                    toast.error(t('toast.errors.unauthorized'));
                } else if (error.response?.status === 413) {
                    toast.error(t('toast.profile.fileTooLarge'));
                } else {
                    toast.error(error.response?.data?.message || t('toast.profile.photoUploadFailed'));
                }
                // Reset preview on error
                setPreview(user?.profileImageUrl || '');
            } finally {
                setUploadingImage(false);
            }
        }
    };

    const isProfileComplete = (u) =>
        Boolean(
            u?.age &&
            u?.gender &&
            (u?.district || u?.location) &&
            (u?.education || '').length > 0 &&
            (u?.occupation || u?.workplace) &&
            (u?.maritalStatus || '').length > 0 &&
            (u?.religion || '').length > 0 &&
            (u?.bio || '').trim().length > 0 &&
            u?.partnerPreferences?.minAge &&
            u?.partnerPreferences?.maxAge &&
            (u?.partnerPreferences?.religion || '').length > 0 &&
            (u?.partnerPreferences?.district || '').length > 0 &&
            (u?.partnerPreferences?.education || '').length > 0 &&
            (u?.partnerPreferences?.maritalStatus || '').length > 0
        );

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        const requiredFields = ['age', 'gender', 'education', 'occupation', 'maritalStatus', 'religion', 'bio'];
        const missingFields = requiredFields.filter(field => !formData[field] || String(formData[field]).trim() === '');

        const partner = formData.partnerPreferences || {};
        const requiredPartnerFields = ['minAge', 'maxAge', 'religion', 'district', 'education', 'maritalStatus'];
        const missingPartnerFields = requiredPartnerFields.filter(field => !partner[field] || String(partner[field]).trim() === '');

        if (missingFields.length > 0 || missingPartnerFields.length > 0) {
            const allMissing = [
                ...missingFields.map(f => f.charAt(0).toUpperCase() + f.slice(1)),
                ...missingPartnerFields.map(f => `Partner ${f.charAt(0).toUpperCase() + f.slice(1)}`)
            ];
            toast.error(t('toast.errors.validationError') + `: ${allMissing.join(', ')}`);
            return;
        }

        // Validate age
        if (formData.age < 18 || formData.age > 100) {
            toast.error(t('toast.errors.validationError') + ': Age must be between 18 and 100');
            return;
        }

        setLoading(true);

        try {
            const response = await userAPI.updateProfile(formData);
            const merged = { ...user, ...response.data };
            updateUser(merged);
            toast.success(isProfileComplete(merged) ? t('toast.profile.updateSuccess') : t('common.save') + ' ' + t('common.success'));
            navigate('/dashboard');
        } catch (error) {
            console.error('Profile update error:', error);
            if (error.response?.status === 401) {
                toast.error(t('toast.errors.unauthorized'));
            } else if (error.response?.status === 400) {
                toast.error(error.response?.data?.message || t('toast.errors.validationError'));
            } else {
                toast.error(error.response?.data?.message || t('toast.errors.serverError'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8">
            <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
                <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-8 text-center flex items-center justify-center gap-2 sm:gap-3">
                    <User className="w-6 h-6 sm:w-10 sm:h-10 text-purple-600 flex-shrink-0" />
                    <span>My Profile</span>
                </h1>

                {/* Profile Image Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-8 md:p-10 mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-center text-gray-900 dark:text-white flex items-center justify-center gap-2 sm:gap-3">
                        <Upload className="w-5 h-5 sm:w-7 sm:h-7 text-purple-600 flex-shrink-0" />
                        <span className="hidden sm:inline">Profile Picture</span>
                        <span className="sm:hidden">Photo</span>
                    </h2>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
                        <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden ring-4 sm:ring-8 ring-purple-100 dark:ring-purple-900/30 shadow-lg flex-shrink-0">
                            {preview ? (
                                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-white text-center">
                                    {formData.gender === 'male' ? (
                                        <div className="text-4xl sm:text-6xl">👨</div>
                                    ) : (
                                        <div className="text-4xl sm:text-6xl">👩</div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-3 w-full sm:w-auto">
                            <label className="cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold inline-flex items-center gap-2 transition-all transform hover:scale-105 shadow-md text-xs sm:text-sm sm:text-base whitespace-nowrap">
                                <Upload className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                <span>{uploadingImage ? 'Uploading...' : 'Choose Image'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                            {uploadingImage && (
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Uploading image...</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-8 md:p-10 border border-gray-100 dark:border-gray-700">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-8 justify-center border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4 overflow-x-auto">
                        {['about', 'religion', 'family', 'lifestyle', 'partner'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTab(t)}
                                className={`px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${tab === t
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t === 'about' ? '👤 Me' : t === 'religion' ? '🙏 Religion' : t === 'family' ? '👨‍👩‍👧 Family' : t === 'lifestyle' ? '🏃 Lifestyle' : '💕 Partner'}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
                        {tab === 'about' && (
                            <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Name</label>
                                        <input type="text" name="profileName" value={formData.profileName} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all placeholder:text-xs sm:placeholder:text-sm" placeholder="Visible to others" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Phone</label>
                                        <input type="tel" inputMode="numeric" pattern="[0-9]*" name="phoneNumber" value={formData.phoneNumber} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Age</label>
                                        <input type="number" name="age" value={formData.age} onChange={onChange} min="18" max="100" className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.age ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`} />
                                        {missing.age && (<p className="text-xs text-red-600 mt-0.5">Required</p>)}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.gender ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
                                        <input type="text" name="location" value={formData.location} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.locOrDistrict ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`} />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">District</label>
                                        <select name="district" value={formData.district} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.locOrDistrict ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            {['', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Other'].map((d) => (
                                                <option key={d} value={d}>{d || 'Select'}</option>
                                            ))}
                                        </select>
                                        {missing.locOrDistrict && (<p className="text-xs text-red-600 mt-0.5">Either is required</p>)}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Education</label>
                                        <select name="education" value={formData.education} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.education ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            {['', 'High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Workplace</label>
                                        <select name="workplace" value={formData.workplace} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.occupationOrWorkplace ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            {['', 'Government', 'Private', 'Self-employed', 'Student', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Occupation</label>
                                        <select name="occupation" value={formData.occupation} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.occupationOrWorkplace ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            {['', 'Software Engineer', 'Engineer', 'Doctor', 'Nurse', 'Teacher', 'Lecturer', 'Government Servant', 'Private Sector Employee', 'Business Owner', 'Student', 'Housewife', 'Unemployed', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                        {missing.occupationOrWorkplace && (<p className="text-xs text-red-600 mt-0.5">Required</p>)}
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Bio</label>
                                    <textarea name="bio" value={formData.bio} onChange={onChange} rows="3" maxLength="500" className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all resize-none text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.bio ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`} placeholder="Tell us about yourself..." />
                                    {missing.bio && (<p className="text-xs text-red-600 mt-0.5">Required</p>)}
                                    <p className="text-xs text-gray-500 flex items-center justify-between mt-1">
                                        <span>Be engaging!</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{formData.bio.length}/500</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Interests</label>
                                        <textarea name="interests" value={formData.interests} onChange={onChange} rows="2" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all resize-none text-xs sm:text-base" placeholder="e.g. music, travel (comma separated)" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Hobbies</label>
                                        <textarea name="hobbies" value={formData.hobbies} onChange={onChange} rows="2" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all resize-none text-xs sm:text-base" placeholder="What you enjoy..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'religion' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                                    <select name="religion" value={formData.religion} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.religion ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                        {['', 'Buddhist', 'Hindu', 'Muslim', 'Christian', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                    {missing.religion && (<p className="text-xs text-red-600 mt-0.5">Required</p>)}
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Caste</label>
                                    <select name="caste" value={formData.caste} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Govigama', 'Karava', 'Salagama', 'Durava', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Ethnicity</label>
                                    <select name="ethnicity" value={formData.ethnicity} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Social Class</label>
                                    <select name="socialClass" value={formData.socialClass} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Lower Class', 'Middle Class', 'Upper Middle Class', 'Upper Class'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {tab === 'family' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Family</label>
                                    <select name="family" value={formData.family} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Nuclear Family', 'Joint Family', 'Extended Family'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Residency</label>
                                    <select name="residency" value={formData.residency} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Citizen', 'Permanent Resident', 'Work Visa', 'Student Visa', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-1.5 sm:space-y-2 sm:col-span-2">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                    <select name="status" value={formData.status} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                        {['', 'Middle Class', 'Upper Middle Class', 'Rich', 'Affluent'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {tab === 'lifestyle' && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Height</label>
                                        <select name="height" value={formData.height} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', `4'10"`, `4'11"`, `5'0"`, `5'1"`, `5'2"`, `5'3"`, `5'4"`, `5'5"`, `5'6"`, `5'7"`, `5'8"`, `5'9"`, `5'10"`, `5'11"`, `6'0"`, `6'1"`, `6'2"`, `6'3"`, `6'4"`, `6'5"`].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Weight</label>
                                        <select name="weight" value={formData.weight} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', '40-49 kg', '50-59 kg', '60-69 kg', '70-79 kg', '80-89 kg', '90-99 kg', '100+ kg'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Body Type</label>
                                        <select name="bodyType" value={formData.bodyType} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Slim', 'Average', 'Athletic', 'Heavy'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</label>
                                        <select name="appearance" value={formData.appearance} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Attractive', 'Handsome/Pretty', 'Average'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Complexion</label>
                                        <select name="complexion" value={formData.complexion} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Very Fair', 'Fair', 'Wheatish', 'Dark'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Smoking</label>
                                        <select name="smoking" value={formData.smoking} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Drinking</label>
                                        <select name="drinking" value={formData.drinking} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Marital Status</label>
                                        <select name="maritalStatus" value={formData.maritalStatus} onChange={onChange} className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:ring-3 transition-all text-xs sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${missing.maritalStatus ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500'}`}>
                                            {['single', 'divorced', 'widowed'].map((o) => (<option key={o} value={o}>{o}</option>))}
                                        </select>
                                        {missing.maritalStatus && (<p className="text-xs text-red-600 mt-0.5">Required</p>)}
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Children</label>
                                        <select name="children" value={formData.children} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'None', '1', '2', '3+'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Personality</label>
                                        <select name="personality" value={formData.personality} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Introvert', 'Extrovert', 'Ambivert', 'Easygoing', 'Serious', 'Fun-loving'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">First Date</label>
                                        <select name="firstDatePreference" value={formData.firstDatePreference} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Coffee/Tea', 'Dinner', 'Walk in the park', 'Movie', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Living Arrangements</label>
                                        <select name="livingArrangements" value={formData.livingArrangements} onChange={onChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'With parents', 'Alone', 'With roommates', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'partner' && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Min Age</label>
                                        <input type="number" name="minAge" value={formData.partnerPreferences?.minAge || ''} onChange={onPrefChange} min="18" max="100" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Max Age</label>
                                        <input type="number" name="maxAge" value={formData.partnerPreferences?.maxAge || ''} onChange={onPrefChange} min="18" max="100" className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                                        <select name="religion" value={formData.partnerPreferences?.religion || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Buddhist', 'Hindu', 'Muslim', 'Christian', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Caste</label>
                                        <select name="caste" value={formData.partnerPreferences?.caste || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Govigama', 'Karava', 'Salagama', 'Durava', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">District</label>
                                        <select name="district" value={formData.partnerPreferences?.district || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Other'].map((d) => (
                                                <option key={d} value={d}>{d || 'Select'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Marital Status</label>
                                        <select name="maritalStatus" value={formData.partnerPreferences?.maritalStatus || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'single', 'divorced', 'widowed'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Smoking</label>
                                        <select name="smoking" value={formData.partnerPreferences?.smoking || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Drinking</label>
                                        <select name="drinking" value={formData.partnerPreferences?.drinking || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Education</label>
                                        <select name="education" value={formData.partnerPreferences?.education || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Body Type</label>
                                        <select name="bodyType" value={formData.partnerPreferences?.bodyType || ''} onChange={onPrefChange} className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg sm:rounded-xl focus:ring-3 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all text-xs sm:text-base">
                                            {['', 'Slim', 'Average', 'Athletic', 'Heavy'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {currentIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setTab(steps[currentIndex - 1])}
                                    className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold text-xs sm:text-sm w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span>Previous</span>
                                </button>
                            )}
                            <div className="flex-1"></div>
                            {currentIndex < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setTab(steps[currentIndex + 1])}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-md text-xs sm:text-sm w-full sm:w-auto"
                                >
                                    <span>Next</span>
                                    <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm w-full sm:w-auto"
                                >
                                    <Save className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                    <span>{loading ? 'Saving...' : 'Save'}</span>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
