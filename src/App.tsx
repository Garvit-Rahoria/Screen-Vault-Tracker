import React, { useState, useEffect } from 'react';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './Dashboard';

function applyStoredTheme() {
  const theme = (localStorage.getItem('app-theme') as 'light' | 'dark') || 'light';
  document.documentElement.classList.toggle('dark-theme', theme === 'dark');
  document.body.classList.toggle('dark-theme', theme === 'dark');
  return theme;
}

export const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => applyStoredTheme());

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Check if user is already logged in
    if ((window as any).api?.getSettings) {
      (window as any).api.getSettings().then((settings: any) => {
        if (settings?.user?.email) {
          setUserEmail(settings.user.email);
        }
      });
    }
  }, []);

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
  };

  const handleLogout = () => {
    setUserEmail(null);
    if ((window as any).api?.saveSettings) {
      (window as any).api.getSettings().then((settings: any) => {
        (window as any).api.saveSettings({
          ...settings,
          user: null
        });
      });
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!userEmail) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} theme={theme} onToggleTheme={toggleTheme} />;
  }

  return (
    <Dashboard
      userEmail={userEmail}
      onLogout={handleLogout}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  );
};

export default App;
