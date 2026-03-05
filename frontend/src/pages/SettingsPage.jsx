import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSidebarOpen } from '../App';
import { changePassword, changeEmail, setupTotp, verifyTotpSetup, disableTotp } from '../api/endpoints';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const openSidebar = useSidebarOpen();

  // Password change
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email change
  const [emailForm, setEmailForm] = useState({ password: '', newEmail: '' });
  const [emailLoading, setEmailLoading] = useState(false);

  // 2FA
  const [twoFaStep, setTwoFaStep] = useState('idle'); // 'idle' | 'setup' | 'verify'
  const [twoFaQr, setTwoFaQr] = useState('');
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaToken, setTwoFaToken] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      await changeEmail({
        password: emailForm.password,
        newEmail: emailForm.newEmail,
      });
      toast.success('Email changed. Please verify your new email.');
      setEmailForm({ password: '', newEmail: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSetupTotp = async () => {
    setTwoFaLoading(true);
    try {
      const res = await setupTotp();
      setTwoFaQr(res.data.qrCode);
      setTwoFaSecret(res.data.secret);
      setTwoFaStep('setup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start 2FA setup');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerifyTotp = async (e) => {
    e.preventDefault();
    setTwoFaLoading(true);
    try {
      await verifyTotpSetup({ token: twoFaToken });
      toast.success('Two-factor authentication enabled!');
      setUser((prev) => prev ? { ...prev, twoFactorEnabled: true } : prev);
      setTwoFaStep('idle');
      setTwoFaQr('');
      setTwoFaSecret('');
      setTwoFaToken('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code, try again');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleDisableTotp = async (e) => {
    e.preventDefault();
    setTwoFaLoading(true);
    try {
      await disableTotp({ password: disablePassword });
      toast.success('Two-factor authentication disabled');
      setUser((prev) => prev ? { ...prev, twoFactorEnabled: false } : prev);
      setShowDisable(false);
      setDisablePassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={openSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-dark-surface rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name</span>
            <p className="text-white font-medium">{user?.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Email</span>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <span className="text-gray-500">Role</span>
            <p className="text-white font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
            required
            className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={passwordLoading}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {passwordLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Change Email */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Change Email</h2>
        <p className="text-sm text-gray-500 mb-4">Changing your email requires re-verification.</p>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="email"
              placeholder="New Email Address"
              value={emailForm.newEmail}
              onChange={(e) => setEmailForm((p) => ({ ...p, newEmail: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
            <input
              type="password"
              placeholder="Confirm with Password"
              value={emailForm.password}
              onChange={(e) => setEmailForm((p) => ({ ...p, password: e.target.value }))}
              required
              className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={emailLoading}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {emailLoading ? 'Changing...' : 'Change Email'}
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add an extra layer of security using an authenticator app like Google Authenticator or Authy.
        </p>

        {user?.twoFactorEnabled ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-800">
                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Enabled
              </span>
            </div>

            {!showDisable ? (
              <button
                onClick={() => setShowDisable(true)}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-800 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium"
              >
                Disable 2FA
              </button>
            ) : (
              <form onSubmit={handleDisableTotp} className="space-y-3">
                <input
                  type="password"
                  placeholder="Enter your password to confirm"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={twoFaLoading}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {twoFaLoading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDisable(false); setDisablePassword(''); }}
                    className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : twoFaStep === 'idle' ? (
          <button
            onClick={handleSetupTotp}
            disabled={twoFaLoading}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
          >
            {twoFaLoading ? 'Setting up...' : 'Enable 2FA'}
          </button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Scan the QR code below with your authenticator app:
            </p>
            {twoFaQr && (
              <div className="flex justify-center">
                <img src={twoFaQr} alt="TOTP QR Code" className="w-48 h-48 rounded-lg bg-white p-2" />
              </div>
            )}
            <div className="bg-dark-surface border border-dark-border rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this key manually:</p>
              <code className="text-sm text-primary-400 break-all select-all">{twoFaSecret}</code>
            </div>
            <form onSubmit={handleVerifyTotp} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Enter 6-digit code from your app
                </label>
                <input
                  type="text"
                  value={twoFaToken}
                  onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-2.5 bg-dark-surface border border-dark-border rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  placeholder="000000"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={twoFaLoading || twoFaToken.length !== 6}
                  className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium text-sm"
                >
                  {twoFaLoading ? 'Verifying...' : 'Verify & Enable'}
                </button>
                <button
                  type="button"
                  onClick={() => { setTwoFaStep('idle'); setTwoFaQr(''); setTwoFaSecret(''); setTwoFaToken(''); }}
                  className="px-4 py-2.5 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
