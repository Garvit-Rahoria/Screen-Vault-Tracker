import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, UserPlus, LogIn, CheckCircle, Sun, Moon } from 'lucide-react';
import { RedRingLogo } from './RedRingLogo';

interface LoginModalProps {
  onLoginSuccess: (email: string) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, theme, onToggleTheme }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        if ((window as any).api?.register) {
          const res = await (window as any).api.register({ email, pass: password });
          if (res.success) {
            setSuccessMsg(res.message || 'Credentials registered successfully! You can now sign in.');
            setIsRegister(false);
          } else {
            setError(res.message || 'Registration failed.');
          }
        } else {
          setSuccessMsg('Registration simulated! You can now sign in.');
          setIsRegister(false);
        }
      } else {
        if ((window as any).api?.login) {
          const res = await (window as any).api.login({ email, pass: password });
          if (res.success) {
            onLoginSuccess(email);
          } else {
            setError(res.message || 'Authentication failed. Please check your credentials.');
          }
        } else {
          if (
            (email === 'admin@company.com' && password === 'admin123') ||
            (email === 'demo@company.com' && password === 'demo123') ||
            (email === 'user@company.com' && password === 'user123')
          ) {
            onLoginSuccess(email);
          } else {
            setError('Invalid credentials! Please use valid credentials or register a new user.');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="login-shell">
      <button
        className="btn-secondary login-theme-btn"
        onClick={onToggleTheme}
        style={{ padding: '9px 14px' }}
        title="Toggle Dark / Light Mode"
      >
        {theme === 'light' ? <Moon size={15} color="var(--text-muted)" /> : <Sun size={15} color="#f59e0b" />}
        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      <div className="glass-card login-card" style={{
        border: '1px solid var(--border-medium)',
        boxShadow: theme === 'dark' ? '0 20px 50px rgba(0, 0, 0, 0.6)' : '0 20px 50px rgba(15, 23, 42, 0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: 'var(--accent-red-light)',
            border: '1px solid var(--border-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <RedRingLogo size={52} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.4px', color: 'var(--text-dark)' }}>
            {isRegister ? 'Register Account' : 'Screen Vault Auth'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', fontWeight: '500' }}>
            {isRegister
              ? 'Create new authorized credentials to access the vault'
              : 'Sign in with organization work credentials'}
          </p>
        </div>

        <div style={{
          display: 'flex',
          background: 'var(--bg-muted)',
          borderRadius: '10px',
          padding: '3px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: !isRegister ? 'var(--accent-red)' : 'transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: !isRegister ? '0 2px 10px rgba(225, 29, 72, 0.3)' : 'none'
            }}
          >
            <LogIn size={14} />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: isRegister ? 'var(--accent-red)' : 'transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: '600',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: isRegister ? '0 2px 10px rgba(225, 29, 72, 0.3)' : 'none'
            }}
          >
            <UserPlus size={14} />
            Register Account
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(225, 29, 72, 0.12)',
            border: '1px solid rgba(225, 29, 72, 0.3)',
            color: 'var(--accent-rose)',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--accent-emerald)',
            padding: '10px 14px',
            borderRadius: '9px',
            fontSize: '12px',
            fontWeight: '500',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={15} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Work Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="email"
                className="input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input
                type="password"
                className="input-field"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '40px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '6px', padding: '13px' }}
          >
            {loading ? 'Processing...' : (
              <>
                {isRegister ? 'Register Credentials' : 'Sign In to Session'}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {!isRegister && (
          <div style={{
            marginTop: '22px',
            padding: '12px 14px',
            background: 'var(--accent-red-light)',
            border: '1px solid var(--border-red)',
            borderRadius: '10px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: '700', color: 'var(--accent-red)', marginBottom: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Quick Test Credentials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@company.com', 'admin123')}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '7px',
                  padding: '6px 10px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span><strong>Admin:</strong> admin@company.com</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>admin123</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('demo@company.com', 'demo123')}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '7px',
                  padding: '6px 10px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '11px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span><strong>Demo:</strong> demo@company.com</span>
                <span style={{ color: 'var(--accent-red)', fontWeight: '600' }}>demo123</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
