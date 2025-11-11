import {useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {useNavigate} from 'react-router-dom';
import {
    User, Mail, Lock, Bell, Palette, Globe,
    Shield, Trash2, Save, ArrowLeft, Eye, EyeOff,
    CheckCircle, AlertCircle, Camera, Download, Plus, Minus
} from 'lucide-react';
import {useTheme} from '../context/ThemeContext';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Settings = () => {
    const {isDark, currentTheme} = useTheme();
    const {user, logout, updateUser} = useAuthStore();
    const navigate = useNavigate();

    // Tab state
    const [activeTab, setActiveTab] = useState('profile');

    // Profile settings - Initialize with empty, will sync with user via useEffect
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bio: '',
        website: '',
        location: ''
    });

    // Account settings
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Preferences
    const [preferences, setPreferences] = useState({
        emailNotifications: true,
        browserNotifications: false,
        galleryUpdates: true,
        marketingEmails: false,
        defaultGalleryVisibility: 'private',
        autoSave: true,
        compressImages: true,
        defaultThreshold: 80,
        language: 'en'
    });

    // Valid threshold values
    const THRESHOLD_VALUES = [20, 40, 80, 140, 200];

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch fresh user settings and metadata on mount
    useEffect(() => {
        fetchUserSettings();
    }, []);

    const fetchUserSettings = async () => {
        setIsLoading(true);
        try {
            // Fetch both settings and fresh user metadata from backend
            const [settingsData, freshUser] = await Promise.all([
                api.get('/api/user/settings'),
                api.get('/api/auth/me').then(res => res.user).catch(() => null)
            ]);

            // console.log('Fetched settings:', settingsData);
            if (settingsData) {
                if (settingsData.profile) {
                    setProfile(prev => ({
                        name: (freshUser?.name || settingsData.profile.name || ''),
                        email: (freshUser?.email || settingsData.profile.email || ''),
                        bio: settingsData.profile.bio || '',
                        website: settingsData.profile.website || '',
                        location: settingsData.profile.location || ''
                    }));
                }
                if (settingsData.preferences) {
                    // Ensure threshold is a valid value
                    let threshold = settingsData.preferences.defaultThreshold || 80;
                    if (!THRESHOLD_VALUES.includes(threshold)) {
                        // Find closest valid threshold
                        threshold = THRESHOLD_VALUES.reduce((prev, curr) =>
                            Math.abs(curr - threshold) < Math.abs(prev - threshold) ? curr : prev
                        );
                    }
                    // console.log('Loading threshold from DB:', threshold);
                    setPreferences({
                        emailNotifications: settingsData.preferences.emailNotifications !== false,
                        browserNotifications: settingsData.preferences.browserNotifications === true,
                        galleryUpdates: settingsData.preferences.galleryUpdates !== false,
                        marketingEmails: settingsData.preferences.marketingEmails === true,
                        defaultGalleryVisibility: settingsData.preferences.defaultGalleryVisibility || 'private',
                        autoSave: settingsData.preferences.autoSave !== false,
                        compressImages: settingsData.preferences.compressImages !== false,
                        defaultThreshold: threshold,
                        language: settingsData.preferences.language || 'en'
                    });
                }
            }
        } catch (error) {
            // console.error('Error fetching settings:', error);
            // Don't show error toast on initial fetch if settings don't exist yet
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            // console.log('Saving profile:', profile);
            await api.put('/api/user/profile', {
                name: profile.name,
                bio: profile.bio,
                website: profile.website,
                location: profile.location
            });

            // Fetch fresh user data from backend
            try {
                const userData = await api.get('/api/auth/me');
                if (userData && userData.user) {
                    // console.log('Updating auth store with fresh data:', userData.user);
                    updateUser(userData.user);
                }
            } catch (e) {
                // console.log('Could not fetch updated user data');
                // Fallback: just update name
                updateUser({name: profile.name});
            }

            toast.success('Profile updated successfully!');
        } catch (error) {
            // console.error('Error saving profile:', error);
            toast.error(error.response?.data?.error || error.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsSaving(true);
        try {
            await api.post('/api/user/change-password', {
                currentPassword,
                newPassword
            });
            toast.success('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error(error.message || 'Failed to change password');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        try {
            // console.log('Saving preferences:', preferences);

            // Step 1: Save preferences to database
            toast.loading('Saving preferences...', {id: 'save-prefs'});
            await api.put('/api/user/preferences', preferences);
            toast.success('Preferences saved!', {id: 'save-prefs'});

            // Step 2: Apply threshold to all existing galleries
            toast.loading('Applying threshold to galleries...', {id: 'apply-threshold'});
            const galleries = await api.get('/api/galleries');

            if (galleries && galleries.length > 0) {
                let updated = 0;
                for (const gallery of galleries) {
                    await api.patch(`/api/galleries/${gallery.id}`, {
                        config: {
                            ...gallery.config,
                            threshold: preferences.defaultThreshold
                        }
                    });
                    updated++;
                }
                toast.success(`✓ Updated ${updated} galleries to ${preferences.defaultThreshold}px!`, {id: 'apply-threshold'});
            } else {
                toast.dismiss('apply-threshold');
            }

        } catch (error) {
            // console.error('Error saving preferences:', error);
            toast.error(error.message || 'Failed to update', {id: 'save-prefs'});
            toast.dismiss('apply-threshold');
        } finally {
            setIsSaving(false);
        }
    };


    const handleExportData = async () => {
        try {
            toast.loading('Preparing your data export...');
            const response = await api.get('/user/export-data');

            // Create a blob and download - response is already the parsed data
            const blob = new Blob([JSON.stringify(response, null, 2)], {type: 'application/json'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cursor-gallery-data-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.dismiss();
            toast.success('Data exported successfully!');
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Failed to export data');
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
            toast.error('Please type "DELETE MY ACCOUNT" to confirm');
            return;
        }

        setIsSaving(true);
        try {
            await api.delete('/api/user/account');
            toast.success('Account deleted successfully');
            logout();
            navigate('/');
        } catch (error) {
            toast.error(error.message || 'Failed to delete account');
            setIsSaving(false);
        }
    };

    const tabs = [
        {id: 'profile', label: 'Profile', icon: User},
        {id: 'account', label: 'Account', icon: Lock},
        {id: 'preferences', label: 'Preferences', icon: Bell},
        {id: 'danger', label: 'Danger Zone', icon: Shield}
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4" style={{backgroundColor: currentTheme.bg}}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{opacity: 0, y: -20}}
                    animate={{opacity: 1, y: 0}}
                    className="mb-8"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 mb-4 text-sm transition-colors duration-300"
                        style={{color: currentTheme.textDim}}
                        onMouseEnter={(e) => e.target.style.color = currentTheme.text}
                        onMouseLeave={(e) => e.target.style.color = currentTheme.textDim}
                    >
                        <ArrowLeft size={16}/>
                        <span className="tracking-wider">BACK TO DASHBOARD</span>
                    </button>

                    <h1
                        className="text-3xl md:text-4xl font-light tracking-wider mb-2"
                        style={{color: currentTheme.text}}
                    >
                        SETTINGS
                    </h1>
                    <p style={{color: currentTheme.textDim}} className="text-sm tracking-wide">
                        Manage your account and preferences
                    </p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.1}}
                    className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 sm:pb-0 settings-tabs"
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] sm:text-xs tracking-wider border transition-all duration-300 whitespace-nowrap settings-tab"
                                style={{
                                    backgroundColor: isActive ? currentTheme.accent : 'transparent',
                                    color: isActive ? (isDark ? '#0a0a0a' : '#f5f3ef') : currentTheme.textDim,
                                    borderColor: isActive ? currentTheme.accent : currentTheme.border
                                }}
                            >
                                <Icon size={window.innerWidth < 640 ? 12 : 14}/>
                                {tab.label}
                            </button>
                        );
                    })}
                </motion.div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{opacity: 0, x: 20}}
                    animate={{opacity: 1, x: 0}}
                    transition={{duration: 0.3}}
                >
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div
                                className="border p-6 md:p-8"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border
                                }}
                            >
                                <h2
                                    className="text-xl font-light tracking-wider mb-6"
                                    style={{color: currentTheme.text}}
                                >
                                    PROFILE INFORMATION
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            FULL NAME
                                        </label>
                                        <input
                                            type="text"
                                            value={profile.name}
                                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                                            className="w-full px-4 py-3 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                            style={{
                                                backgroundColor: currentTheme.bg,
                                                borderColor: currentTheme.border,
                                                color: currentTheme.text
                                            }}
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            EMAIL
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="email"
                                                value={profile.email}
                                                disabled
                                                className="flex-1 px-4 py-3 border text-sm tracking-wide opacity-60 cursor-not-allowed"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                            />
                                            <CheckCircle
                                                size={20}
                                                style={{color: currentTheme.accent}}
                                            />
                                        </div>
                                        <p className="text-xs mt-1" style={{color: currentTheme.textDim}}>
                                            Email cannot be changed
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            BIO
                                        </label>
                                        <textarea
                                            value={profile.bio}
                                            onChange={(e) => setProfile({...profile, bio: e.target.value})}
                                            rows={3}
                                            maxLength={160}
                                            className="w-full px-4 py-3 border text-sm tracking-wide transition-all duration-300 focus:outline-none resize-none"
                                            style={{
                                                backgroundColor: currentTheme.bg,
                                                borderColor: currentTheme.border,
                                                color: currentTheme.text
                                            }}
                                            placeholder="Tell us about yourself..."
                                        />
                                        <p className="text-xs mt-1 text-right" style={{color: currentTheme.textDim}}>
                                            {profile.bio.length}/160
                                        </p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label
                                                className="block text-xs tracking-wider mb-2"
                                                style={{color: currentTheme.textDim}}
                                            >
                                                WEBSITE
                                            </label>
                                            <input
                                                type="url"
                                                value={profile.website}
                                                onChange={(e) => setProfile({...profile, website: e.target.value})}
                                                className="w-full px-4 py-3 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="https://yourwebsite.com"
                                            />
                                        </div>

                                        <div>
                                            <label
                                                className="block text-xs tracking-wider mb-2"
                                                style={{color: currentTheme.textDim}}
                                            >
                                                LOCATION
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.location}
                                                onChange={(e) => setProfile({...profile, location: e.target.value})}
                                                className="w-full px-4 py-3 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="mt-6 flex items-center gap-2 px-6 py-3 text-xs tracking-wider transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                >
                                    <Save size={14}/>
                                    {isSaving ? 'SAVING...' : 'SAVE PROFILE'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div
                                className="border p-6 md:p-8"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border
                                }}
                            >
                                <h2
                                    className="text-xl font-light tracking-wider mb-6"
                                    style={{color: currentTheme.text}}
                                >
                                    CHANGE PASSWORD
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            CURRENT PASSWORD
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                                style={{color: currentTheme.textDim}}
                                            >
                                                {showCurrentPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            NEW PASSWORD
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="Enter new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                                style={{color: currentTheme.textDim}}
                                            >
                                                {showNewPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            CONFIRM NEW PASSWORD
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 pr-12 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2"
                                                style={{color: currentTheme.textDim}}
                                            >
                                                {showConfirmPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                            </button>
                                        </div>
                                    </div>

                                    {newPassword && (
                                        <div className="p-4 border" style={{borderColor: currentTheme.border}}>
                                            <p className="text-xs tracking-wide mb-2"
                                               style={{color: currentTheme.textDim}}>
                                                Password strength:
                                            </p>
                                            <div className="flex gap-1 mb-2">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className="h-1 flex-1"
                                                        style={{
                                                            backgroundColor: i <= (newPassword.length >= 12 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1)
                                                                ? currentTheme.accent
                                                                : currentTheme.border
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <ul className="text-xs space-y-1" style={{color: currentTheme.textDim}}>
                                                <li className={newPassword.length >= 8 ? 'text-green-500' : ''}>
                                                    • At least 8 characters
                                                </li>
                                                <li className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? 'text-green-500' : ''}>
                                                    • Mix of uppercase and lowercase
                                                </li>
                                                <li className={/\d/.test(newPassword) ? 'text-green-500' : ''}>
                                                    • At least one number
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleChangePassword}
                                    disabled={isSaving}
                                    className="mt-6 flex items-center gap-2 px-6 py-3 text-xs tracking-wider transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                >
                                    <Lock size={14}/>
                                    {isSaving ? 'UPDATING...' : 'CHANGE PASSWORD'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="space-y-6">
                            <div
                                className="border p-6 md:p-8"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border
                                }}
                            >
                                <h2
                                    className="text-xl font-light tracking-wider mb-6"
                                    style={{color: currentTheme.text}}
                                >
                                    NOTIFICATIONS
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        {
                                            key: 'emailNotifications',
                                            label: 'Email Notifications',
                                            desc: 'Receive email notifications about your galleries'
                                        },
                                        {
                                            key: 'browserNotifications',
                                            label: 'Browser Notifications',
                                            desc: 'Get push notifications in your browser'
                                        },
                                        {
                                            key: 'galleryUpdates',
                                            label: 'Gallery Updates',
                                            desc: 'Notifications when galleries are published or updated'
                                        },
                                        {
                                            key: 'marketingEmails',
                                            label: 'Marketing Emails',
                                            desc: 'Receive updates about new features and tips'
                                        }
                                    ].map((item) => (
                                        <div key={item.key}
                                             className="flex items-start justify-between gap-4 py-3 border-b"
                                             style={{borderColor: currentTheme.border}}>
                                            <div className="flex-1">
                                                <p className="text-sm tracking-wide" style={{color: currentTheme.text}}>
                                                    {item.label}
                                                </p>
                                                <p className="text-xs mt-1" style={{color: currentTheme.textDim}}>
                                                    {item.desc}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setPreferences({
                                                    ...preferences,
                                                    [item.key]: !preferences[item.key]
                                                })}
                                                className="relative w-12 h-6 border transition-all duration-300"
                                                style={{
                                                    backgroundColor: preferences[item.key] ? currentTheme.accent : currentTheme.bg,
                                                    borderColor: currentTheme.border
                                                }}
                                            >
                                                <div
                                                    className="absolute top-1 w-4 h-4 transition-all duration-300"
                                                    style={{
                                                        left: preferences[item.key] ? '1.5rem' : '0.25rem',
                                                        backgroundColor: isDark ? '#0a0a0a' : '#f5f3ef'
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div
                                className="border p-6 md:p-8"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border
                                }}
                            >
                                <h2
                                    className="text-xl font-light tracking-wider mb-6"
                                    style={{color: currentTheme.text}}
                                >
                                    GALLERY DEFAULTS
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            DEFAULT VISIBILITY
                                        </label>
                                        <select
                                            value={preferences.defaultGalleryVisibility}
                                            onChange={(e) => setPreferences({
                                                ...preferences,
                                                defaultGalleryVisibility: e.target.value
                                            })}
                                            className="w-full px-4 py-3 border text-sm tracking-wide transition-all duration-300 focus:outline-none"
                                            style={{
                                                backgroundColor: currentTheme.bg,
                                                borderColor: currentTheme.border,
                                                color: currentTheme.text
                                            }}
                                        >
                                            <option value="private">Private</option>
                                            <option value="public">Public</option>
                                            <option value="unlisted">Unlisted</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label
                                            className="block text-xs tracking-wider mb-2"
                                            style={{color: currentTheme.textDim}}
                                        >
                                            DEFAULT THRESHOLD
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() => {
                                                    const currentIndex = THRESHOLD_VALUES.indexOf(preferences.defaultThreshold);
                                                    if (currentIndex > 0) {
                                                        setPreferences({
                                                            ...preferences,
                                                            defaultThreshold: THRESHOLD_VALUES[currentIndex - 1]
                                                        });
                                                    }
                                                }}
                                                disabled={preferences.defaultThreshold === THRESHOLD_VALUES[0]}
                                                className="px-3 py-2 text-xs transition-all duration-300 border disabled:opacity-30 disabled:cursor-not-allowed"
                                                style={{
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                            >
                                                <Minus size={14}/>
                                            </button>
                                            <p className="text-sm font-medium min-w-[60px] text-center"
                                               style={{color: currentTheme.text}}>
                                                {preferences.defaultThreshold}px
                                            </p>
                                            <button
                                                onClick={() => {
                                                    const currentIndex = THRESHOLD_VALUES.indexOf(preferences.defaultThreshold);
                                                    if (currentIndex < THRESHOLD_VALUES.length - 1) {
                                                        setPreferences({
                                                            ...preferences,
                                                            defaultThreshold: THRESHOLD_VALUES[currentIndex + 1]
                                                        });
                                                    }
                                                }}
                                                disabled={preferences.defaultThreshold === THRESHOLD_VALUES[THRESHOLD_VALUES.length - 1]}
                                                className="px-3 py-2 text-xs transition-all duration-300 border disabled:opacity-30 disabled:cursor-not-allowed"
                                                style={{
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                            >
                                                <Plus size={14}/>
                                            </button>
                                        </div>
                                        <p className="text-xs mt-2" style={{color: currentTheme.textDim}}>
                                            Available values: {THRESHOLD_VALUES.join(', ')}
                                        </p>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <div className="flex items-center justify-between py-3 border-b"
                                             style={{borderColor: currentTheme.border}}>
                                            <div>
                                                <p className="text-sm tracking-wide" style={{color: currentTheme.text}}>
                                                    Auto-save changes
                                                </p>
                                                <p className="text-xs mt-1" style={{color: currentTheme.textDim}}>
                                                    Automatically save gallery edits
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setPreferences({
                                                    ...preferences,
                                                    autoSave: !preferences.autoSave
                                                })}
                                                className="relative w-12 h-6 border transition-all duration-300"
                                                style={{
                                                    backgroundColor: preferences.autoSave ? currentTheme.accent : currentTheme.bg,
                                                    borderColor: currentTheme.border
                                                }}
                                            >
                                                <div
                                                    className="absolute top-1 w-4 h-4 transition-all duration-300"
                                                    style={{
                                                        left: preferences.autoSave ? '1.5rem' : '0.25rem',
                                                        backgroundColor: isDark ? '#0a0a0a' : '#f5f3ef'
                                                    }}
                                                />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-b"
                                             style={{borderColor: currentTheme.border}}>
                                            <div>
                                                <p className="text-sm tracking-wide" style={{color: currentTheme.text}}>
                                                    Compress images on upload
                                                </p>
                                                <p className="text-xs mt-1" style={{color: currentTheme.textDim}}>
                                                    Reduce file size automatically
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setPreferences({
                                                    ...preferences,
                                                    compressImages: !preferences.compressImages
                                                })}
                                                className="relative w-12 h-6 border transition-all duration-300"
                                                style={{
                                                    backgroundColor: preferences.compressImages ? currentTheme.accent : currentTheme.bg,
                                                    borderColor: currentTheme.border
                                                }}
                                            >
                                                <div
                                                    className="absolute top-1 w-4 h-4 transition-all duration-300"
                                                    style={{
                                                        left: preferences.compressImages ? '1.5rem' : '0.25rem',
                                                        backgroundColor: isDark ? '#0a0a0a' : '#f5f3ef'
                                                    }}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSavePreferences}
                                    disabled={isSaving}
                                    className="mt-6 flex items-center gap-2 px-6 py-3 text-xs tracking-wider transition-all duration-300 disabled:opacity-50"
                                    style={{
                                        backgroundColor: currentTheme.accent,
                                        color: isDark ? '#0a0a0a' : '#f5f3ef'
                                    }}
                                >
                                    <Save size={14}/>
                                    {isSaving ? 'SAVING...' : 'SAVE & APPLY TO ALL GALLERIES'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Tab */}
                    {activeTab === 'danger' && (
                        <div className="space-y-6">
                            <div
                                className="border p-6 md:p-8"
                                style={{
                                    backgroundColor: currentTheme.bgAlt,
                                    borderColor: currentTheme.border
                                }}
                            >
                                <h2
                                    className="text-xl font-light tracking-wider mb-6"
                                    style={{color: currentTheme.text}}
                                >
                                    DATA MANAGEMENT
                                </h2>

                                <div className="space-y-4">
                                    <div className="p-4 border" style={{borderColor: currentTheme.border}}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="text-sm tracking-wide mb-1"
                                                    style={{color: currentTheme.text}}>
                                                    Export Your Data
                                                </h3>
                                                <p className="text-xs" style={{color: currentTheme.textDim}}>
                                                    Download all your galleries and settings as JSON
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleExportData}
                                                className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider border transition-all duration-300"
                                                style={{
                                                    borderColor: currentTheme.border,
                                                    color: currentTheme.text
                                                }}
                                            >
                                                <Download size={14}/>
                                                EXPORT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="border-2 p-6 md:p-8"
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                    borderColor: '#ef4444'
                                }}
                            >
                                <div className="flex items-start gap-3 mb-4">
                                    <AlertCircle size={20} className="text-red-500 mt-0.5"/>
                                    <div>
                                        <h2 className="text-xl font-light tracking-wider mb-2 text-red-500">
                                            DANGER ZONE
                                        </h2>
                                        <p className="text-sm" style={{color: currentTheme.textDim}}>
                                            Irreversible and destructive actions
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 border border-red-500"
                                     style={{backgroundColor: currentTheme.bg}}>
                                    <h3 className="text-sm tracking-wide mb-2" style={{color: currentTheme.text}}>
                                        Delete Account
                                    </h3>
                                    <p className="text-xs mb-4" style={{color: currentTheme.textDim}}>
                                        Once you delete your account, there is no going back. All your galleries,
                                        images, and data will be permanently deleted.
                                    </p>

                                    {!showDeleteConfirm ? (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider transition-all duration-300 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                        >
                                            <Trash2 size={14}/>
                                            DELETE ACCOUNT
                                        </button>
                                    ) : (
                                        <div className="space-y-3">
                                            <p className="text-xs text-red-500 font-medium">
                                                Type "DELETE MY ACCOUNT" to confirm:
                                            </p>
                                            <input
                                                type="text"
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                className="w-full px-4 py-2 border-2 border-red-500 text-sm focus:outline-none"
                                                style={{
                                                    backgroundColor: currentTheme.bg,
                                                    color: currentTheme.text
                                                }}
                                                placeholder="DELETE MY ACCOUNT"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleDeleteAccount}
                                                    disabled={isSaving || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                                                    className="flex items-center gap-2 px-4 py-2 text-xs tracking-wider transition-all duration-300 bg-red-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Trash2 size={14}/>
                                                    {isSaving ? 'DELETING...' : 'CONFIRM DELETE'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeleteConfirmText('');
                                                    }}
                                                    className="px-4 py-2 text-xs tracking-wider border transition-all duration-300"
                                                    style={{
                                                        borderColor: currentTheme.border,
                                                        color: currentTheme.text
                                                    }}
                                                >
                                                    CANCEL
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
