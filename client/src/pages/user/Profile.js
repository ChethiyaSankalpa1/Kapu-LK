import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, userAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { User, Upload, Save, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

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
    const [selectedFile, setSelectedFile] = useState(null);
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
    };

    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            toast.error('Please select an image');
            return;
        }

        const formDataImg = new FormData();
        formDataImg.append('profileImage', selectedFile);
        setUploadingImage(true);

        try {
            const response = await authAPI.uploadProfileImage(formDataImg);
            updateUser({ ...user, profileImageUrl: response.data.profileImageUrl });
            toast.success('Profile image uploaded successfully!');
            setSelectedFile(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Image upload failed');
        } finally {
            setUploadingImage(false);
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
            (u?.bio || '').trim().length > 0
        );

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await userAPI.updateProfile(formData);
            const merged = { ...user, ...response.data };
            updateUser(merged);
            toast.success(isProfileComplete(merged) ? 'Profile completed successfully!' : 'Profile saved successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-10 text-center flex items-center justify-center gap-3">
                    <User className="w-10 h-10 text-purple-600" />
                    My Profile
                </h1>

                {/* Profile Image Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 mb-8 border border-gray-100 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white flex items-center justify-center gap-3">
                        <Upload className="w-7 h-7 text-purple-600" />
                        Profile Picture
                    </h2>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="w-40 h-40 rounded-full bg-gradient-to-r from-pink-400 to-purple-600 flex items-center justify-center overflow-hidden ring-8 ring-purple-100 dark:ring-purple-900/30 shadow-2xl">
                            {preview ? (
                                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-20 h-20 text-white" />
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-4">
                            <label className="cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg">
                                <Upload className="w-5 h-5" />
                                Choose Image
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={onFileChange}
                                    className="hidden"
                                />
                            </label>
                            {selectedFile && (
                                <button
                                    onClick={handleImageUpload}
                                    disabled={uploadingImage}
                                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {uploadingImage ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Upload
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Form */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 border border-gray-100 dark:border-gray-700">
                    {/* Tabs */}
                    <div className="flex flex-wrap gap-4 mb-10 justify-center border-b border-gray-200 dark:border-gray-700 pb-6">
                        {['about', 'religion', 'family', 'lifestyle', 'partner'].map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTab(t)}
                                className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${tab === t
                                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg transform scale-105'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {t === 'about' ? 'About Me' : t === 'religion' ? 'Religion' : t === 'family' ? 'Family' : t === 'lifestyle' ? 'Lifestyle' : 'Partner Preferences'}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <form onSubmit={onSubmit} className="space-y-8">
                        {tab === 'about' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Profile Name</label>
                                        <input type="text" name="profileName" value={formData.profileName} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" placeholder="Name visible to other members" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Phone Number</label>
                                        <input type="tel" inputMode="numeric" pattern="[0-9]*" name="phoneNumber" value={formData.phoneNumber} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Age</label>
                                        <input type="number" name="age" value={formData.age} onChange={onChange} min="18" max="100" className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.age ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')} />
                                        {missing.age && (<p className="text-xs text-red-600 mt-1 flex items-center gap-1">Required</p>)}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.gender ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Location</label>
                                        <input type="text" name="location" value={formData.location} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.locOrDistrict ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">District</label>
                                        <select name="district" value={formData.district} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.locOrDistrict ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                            {['', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Other'].map((d) => (
                                                <option key={d} value={d}>{d || 'Select'}</option>
                                            ))}
                                        </select>
                                        {missing.locOrDistrict && (<p className="text-xs text-red-600 mt-1">Either District or Location is required</p>)}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Education</label>
                                        <select name="education" value={formData.education} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.education ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                            {['', 'High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Workplace</label>
                                        <select name="workplace" value={formData.workplace} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.occupationOrWorkplace ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                            {['', 'Government', 'Private', 'Self-employed', 'Student', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Occupation</label>
                                        <input type="text" name="occupation" value={formData.occupation} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.occupationOrWorkplace ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')} />
                                        {missing.occupationOrWorkplace && (<p className="text-xs text-red-600 mt-1">Occupation or Workplace is required</p>)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Bio</label>
                                    <textarea name="bio" value={formData.bio} onChange={onChange} rows="5" maxLength="500" className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all resize-none " + (missing.bio ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')} placeholder="Tell us about yourself..." />
                                    {missing.bio && (<p className="text-xs text-red-600 mt-1">Required</p>)}
                                    <p className="text-sm text-gray-500 mt-2 flex items-center justify-between">
                                        <span>Write something engaging!</span>
                                        <span className="font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg">{formData.bio.length}/500</span>
                                    </p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Interests</label>
                                        <textarea name="interests" value={formData.interests} onChange={onChange} rows="4" className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all resize-none" placeholder="e.g. music, travel, sports (comma separated)" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Hobbies</label>
                                        <textarea name="hobbies" value={formData.hobbies} onChange={onChange} rows="4" className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all resize-none" placeholder="Share more about what you enjoy doing" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {tab === 'religion' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                                    <select name="religion" value={formData.religion} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.religion ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                        {['', 'Buddhist', 'Hindu', 'Muslim', 'Christian', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                    {missing.religion && (<p className="text-xs text-red-600 mt-1">Required</p>)}
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Caste</label>
                                    <select name="caste" value={formData.caste} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                        {['', 'Govigama', 'Karava', 'Salagama', 'Durava', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Ethnicity</label>
                                    <select name="ethnicity" value={formData.ethnicity} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                        {['', 'Sinhalese', 'Tamil', 'Muslim', 'Burgher', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Social Class</label>
                                    <input type="text" name="socialClass" value={formData.socialClass} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                </div>
                            </div>
                        )}

                        {tab === 'family' && (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Family</label>
                                    <input type="text" name="family" value={formData.family} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Residency</label>
                                    <input type="text" name="residency" value={formData.residency} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Status</label>
                                    <input type="text" name="status" value={formData.status} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                </div>
                            </div>
                        )}

                        {tab === 'lifestyle' && (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Height</label>
                                        <select name="height" value={formData.height} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', `4'10"`, `4'11"`, `5'0"`, `5'1"`, `5'2"`, `5'3"`, `5'4"`, `5'5"`, `5'6"`, `5'7"`, `5'8"`, `5'9"`, `5'10"`, `5'11"`, `6'0"`, `6'1"`, `6'2"`, `6'3"`, `6'4"`, `6'5"`].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Weight</label>
                                        <select name="weight" value={formData.weight} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', '40-49 kg', '50-59 kg', '60-69 kg', '70-79 kg', '80-89 kg', '90-99 kg', '100+ kg'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Body Type</label>
                                        <select name="bodyType" value={formData.bodyType} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Slim', 'Average', 'Athletic', 'Heavy'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Appearance</label>
                                        <select name="appearance" value={formData.appearance} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Attractive', 'Handsome/Pretty', 'Average'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Complexion</label>
                                        <select name="complexion" value={formData.complexion} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Very Fair', 'Fair', 'Wheatish', 'Dark'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Smoking</label>
                                        <select name="smoking" value={formData.smoking} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Drinking</label>
                                        <select name="drinking" value={formData.drinking} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Marital Status</label>
                                        <select name="maritalStatus" value={formData.maritalStatus} onChange={onChange} className={"w-full px-5 py-4 border rounded-xl focus:ring-4 transition-all " + (missing.maritalStatus ? 'border-red-500 focus:ring-red-100 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500')}>
                                            {['single', 'divorced', 'widowed'].map((o) => (<option key={o} value={o}>{o}</option>))}
                                        </select>
                                        {missing.maritalStatus && (<p className="text-xs text-red-600 mt-1">Required</p>)}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Children</label>
                                        <select name="children" value={formData.children} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'None', '1', '2', '3+'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6 pt-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Personality</label>
                                        <input type="text" name="personality" value={formData.personality} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">First Date Preference</label>
                                        <input type="text" name="firstDatePreference" value={formData.firstDatePreference} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Living Arrangements</label>
                                        <input type="text" name="livingArrangements" value={formData.livingArrangements} onChange={onChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                </div>
                            </>
                        )}

                        {tab === 'partner' && (
                            <div className="space-y-8">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Min Age</label>
                                        <input type="number" name="minAge" value={formData.partnerPreferences?.minAge || ''} onChange={onPrefChange} min="18" max="100" className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Max Age</label>
                                        <input type="number" name="maxAge" value={formData.partnerPreferences?.maxAge || ''} onChange={onPrefChange} min="18" max="100" className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Religion</label>
                                        <select name="religion" value={formData.partnerPreferences?.religion || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Buddhist', 'Hindu', 'Muslim', 'Christian', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Caste</label>
                                        <select name="caste" value={formData.partnerPreferences?.caste || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Govigama', 'Karava', 'Salagama', 'Durava', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">District</label>
                                        <select name="district" value={formData.partnerPreferences?.district || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle', 'Other'].map((d) => (
                                                <option key={d} value={d}>{d || 'Select'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Marital Status</label>
                                        <select name="maritalStatus" value={formData.partnerPreferences?.maritalStatus || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'single', 'divorced', 'widowed'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Smoking</label>
                                        <select name="smoking" value={formData.partnerPreferences?.smoking || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Drinking</label>
                                        <select name="drinking" value={formData.partnerPreferences?.drinking || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'No', 'Occasionally', 'Yes'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Education</label>
                                        <select name="education" value={formData.partnerPreferences?.education || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'High School', 'Diploma', 'Bachelor\'s', 'Master\'s', 'PhD', 'Other'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Body Type</label>
                                        <select name="bodyType" value={formData.partnerPreferences?.bodyType || ''} onChange={onPrefChange} className="w-full px-5 py-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/30 focus:border-purple-500 transition-all">
                                            {['', 'Slim', 'Average', 'Athletic', 'Heavy'].map((o) => (<option key={o} value={o}>{o || 'Select'}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex items-center justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
                            {currentIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setTab(steps[currentIndex - 1])}
                                    className="flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all font-semibold"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Previous
                                </button>
                            )}
                            <div className="flex-1"></div>
                            {currentIndex < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setTab(steps[currentIndex + 1])}
                                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
                                >
                                    Next
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{loading ? 'Saving...' : 'Save & Finish'}</span>
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
