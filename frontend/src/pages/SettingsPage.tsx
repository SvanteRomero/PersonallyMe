import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { authService } from '../services/authService';
import { profileSchema, changePasswordSchema, ProfileFormData, ChangePasswordFormData } from '../utils/validation';
import { parseApiError } from '../utils/formatters';
import { THEMES } from '../utils/constants';
import { ThemeName } from '../types';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TagManager from '../components/tags/TagManager';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'password' | 'tags'>('profile');
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);

    const { user, updateUser } = useAuth();
    const { theme, mode, setTheme, toggleMode } = useTheme();
    const { success, error: showError } = useNotification();

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
    } = useForm<ProfileFormData>({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
        },
    });

    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPassword,
    } = useForm<ChangePasswordFormData>({
        resolver: yupResolver(changePasswordSchema),
    });

    const onProfileSubmit = async (data: ProfileFormData) => {
        setIsProfileLoading(true);
        try {
            await updateUser(data);
            success('Profile updated successfully!');
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsProfileLoading(false);
        }
    };

    const onPasswordSubmit = async (data: ChangePasswordFormData) => {
        setIsPasswordLoading(true);
        try {
            await authService.changePassword(data.old_password, data.new_password);
            success('Password changed successfully!');
            resetPassword();
        } catch (err) {
            showError(parseApiError(err));
        } finally {
            setIsPasswordLoading(false);
        }
    };

    const themeOptions = Object.values(THEMES);

    const tabs = [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'tags', label: 'Tags', icon: '🏷️' },
        { id: 'password', label: 'Password', icon: '🔒' },
    ] as const;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-body">Settings</h1>
                <p className="text-muted">Manage your account and preferences</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-themed pb-2 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id
                                ? 'bg-primary text-white'
                                : 'text-body hover:bg-surface-hover'
                            }
            `}
                        style={{ backgroundColor: activeTab === tab.id ? THEMES[theme].primaryColor : undefined }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-surface rounded-xl p-6 border border-themed animate-fade-in">
                    <h2 className="text-lg font-semibold text-body mb-4">Profile Information</h2>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
                        <Input
                            label="Email"
                            value={user?.email || ''}
                            disabled
                            helperText="Email cannot be changed"
                        />
                        <Input
                            label="First Name"
                            error={profileErrors.first_name?.message}
                            {...registerProfile('first_name')}
                        />
                        <Input
                            label="Last Name"
                            error={profileErrors.last_name?.message}
                            {...registerProfile('last_name')}
                        />
                        <Button type="submit" isLoading={isProfileLoading}>
                            Save Changes
                        </Button>
                    </form>
                </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="bg-surface rounded-xl p-6 border border-themed animate-fade-in space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-body mb-4">Color Theme</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {themeOptions.map(option => (
                                <button
                                    key={option.name}
                                    onClick={() => setTheme(option.name as ThemeName)}
                                    className={`
                    p-4 rounded-xl border-2 transition-all
                    ${theme === option.name
                                            ? 'border-primary shadow-lg'
                                            : 'border-themed hover:border-gray-400'
                                        }
                  `}
                                    style={{
                                        borderColor: theme === option.name ? option.primaryColor : undefined,
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg mx-auto mb-3"
                                        style={{ backgroundColor: option.primaryColor }}
                                    />
                                    <h3 className="font-semibold text-body">{option.displayName}</h3>
                                    <p className="text-xs text-muted">{option.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-body mb-4">Mode</h2>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={toggleMode}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all flex-1
                  ${mode === 'light' ? 'border-primary' : 'border-themed hover:border-gray-400'}
                `}
                                style={{
                                    borderColor: mode === 'light' ? THEMES[theme].primaryColor : undefined,
                                }}
                            >
                                <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                <div className="text-left">
                                    <h3 className="font-semibold text-body">Light</h3>
                                    <p className="text-xs text-muted">Bright and clear</p>
                                </div>
                            </button>
                            <button
                                onClick={toggleMode}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all flex-1
                  ${mode === 'dark' ? 'border-primary' : 'border-themed hover:border-gray-400'}
                `}
                                style={{
                                    borderColor: mode === 'dark' ? THEMES[theme].primaryColor : undefined,
                                }}
                            >
                                <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                                <div className="text-left">
                                    <h3 className="font-semibold text-body">Dark</h3>
                                    <p className="text-xs text-muted">Easy on the eyes</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
                <TagManager />
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
                <div className="bg-surface rounded-xl p-6 border border-themed animate-fade-in">
                    <h2 className="text-lg font-semibold text-body mb-4">Change Password</h2>
                    <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                        <Input
                            label="Current Password"
                            type="password"
                            autoComplete="current-password"
                            error={passwordErrors.old_password?.message}
                            {...registerPassword('old_password')}
                        />
                        <Input
                            label="New Password"
                            type="password"
                            autoComplete="new-password"
                            helperText="At least 8 characters with uppercase, lowercase, and number"
                            error={passwordErrors.new_password?.message}
                            {...registerPassword('new_password')}
                        />
                        <Button type="submit" isLoading={isPasswordLoading}>
                            Change Password
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
