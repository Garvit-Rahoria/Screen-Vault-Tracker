import React, { useState, useEffect } from 'react';
import { Play, Pause, Camera, Settings, Clock, ShieldCheck, LogOut, FolderOpen, Database, HardDrive, Sun, Moon } from 'lucide-react';
import { ActivityLog, ActivityItem } from './components/ActivityLog';
import { StorageConfigModal } from './components/StorageConfigModal';
import { RedRingLogo } from './components/RedRingLogo';

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout, theme, onToggleTheme }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(3);
  const [logs, setLogs] = useState<ActivityItem[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const [storageConfig, setStorageConfig] = useState({
    provider: 'mock-storage',
    endpoint: '',
    bucketName: 'company-screen-vault',
    region: 'us-east-1',
    accessKeyId: '',
    secretAccessKey: '',
    quality: 80
  });

  const [diskInfo, setDiskInfo] = useState({ freeGb: 125, totalGb: 237 });

  const isDemoMode = storageConfig.provider === 'mock-storage';
  const isDbLinked = !isDemoMode && Boolean(storageConfig.accessKeyId && storageConfig.secretAccessKey && storageConfig.bucketName);

  useEffect(() => {
    // Sync with Electron main process settings on startup
    if ((window as any).api?.getSettings) {
      (window as any).api.getSettings().then((settings: any) => {
        if (settings) {
          setIsTracking(settings.isTracking || false);
          setIntervalMinutes(settings.intervalMinutes || 3);
          if (settings.storage) setStorageConfig(settings.storage);
        }
      });
    }

    if ((window as any).api?.getDiskInfo) {
      (window as any).api.getDiskInfo().then((res: any) => {
        if (res && res.totalGb) setDiskInfo(res);
      });
    }

    // Subscribe to IPC log stream and tracking state
    let unsubLog: any;
    let unsubStatus: any;

    if ((window as any).api) {
      unsubLog = (window as any).api.onActivityLog((item: ActivityItem) => {
        setLogs((prev) => {
          const index = prev.findIndex((log) => log.id === item.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...item };
            return updated;
          }
          return [item, ...prev.slice(0, 49)];
        });
      });

      unsubStatus = (window as any).api.onStatusChange((status: boolean) => {
        setIsTracking(status);
      });
    }

    return () => {
      if (unsubLog) unsubLog();
      if (unsubStatus) unsubStatus();
    };
  }, []);

  const handleToggleTracking = async () => {
    const nextState = !isTracking;
    setIsTracking(nextState);
    if ((window as any).api?.setTrackingStatus) {
      await (window as any).api.setTrackingStatus(nextState);
    }
  };

  const handleIntervalChange = async (mins: number) => {
    setIntervalMinutes(mins);
    if ((window as any).api?.setInterval) {
      await (window as any).api.setInterval(mins);
    }
  };

  const handleOpenLocalFolder = async (filePath?: string) => {
    if ((window as any).api?.openLocalFolder) {
      await (window as any).api.openLocalFolder(filePath);
    } else {
      alert('Local PC folder feature works when running inside Electron.');
    }
  };

  const handleCaptureNow = async () => {
    if ((window as any).api?.captureNow) {
      await (window as any).api.captureNow();
    } else {
      // Mock snapshot for web preview mode
      const mockLog: ActivityItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        status: isDemoMode || isDbLinked ? 'success' : 'error',
        filename: `screenshot_${Date.now()}.jpg`,
        sizeKb: 142,
        reason: 'manual',
        message: isDemoMode
          ? 'Saved locally to PC (Pictures/ScreenVaultCaptures)'
          : isDbLinked
          ? `Saved to linked Database bucket "${storageConfig.bucketName}"`
          : 'Failed: Database is not linked. Link credentials or switch to Demo Mode.'
      };
      setLogs((prev) => [mockLog, ...prev]);
    }
  };

  const handleSaveStorageConfig = async (newConfig: any) => {
    setStorageConfig(newConfig);
    setShowConfigModal(false);
    if ((window as any).api?.saveSettings) {
      await (window as any).api.saveSettings({
        isTracking,
        intervalMinutes,
        storage: newConfig
      });
    }
  };

  const handleRemoveLog = (id: number) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="app-shell">
      {/* Navigation Top Header */}
      <header className="glass-card app-header">
        <div className="app-header-brand">
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: 'rgba(225, 29, 72, 0.05)',
            border: '1px solid rgba(225, 29, 72, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <RedRingLogo size={34} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1>Screen Vault Tracker</h1>
              <span className="badge badge-red brand-badge">v1.0 Pro</span>
            </div>
            <span className="subtitle-desktop" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
              Enterprise Desktop Screen Activity & Vault Sync
            </span>
          </div>
        </div>

        <div className="app-header-actions">
          <div className="user-chip">
            <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>User:</span>
            <strong style={{ color: 'var(--accent-red)', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</strong>
          </div>

          <button
            className="btn-secondary"
            onClick={onToggleTheme}
            style={{ padding: '9px 14px' }}
            title="Toggle Dark / Light Mode"
          >
            {theme === 'light' ? <Moon size={15} color="var(--text-muted)" /> : <Sun size={15} color="#f59e0b" />}
            <span className="btn-label-full">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            <span className="btn-label-short">{theme === 'light' ? 'Dark' : 'Light'}</span>
          </button>

          <button className="btn-secondary" onClick={() => setShowConfigModal(true)} style={{ padding: '9px 16px' }}>
            <Settings size={15} color="var(--text-muted)" />
            <span className="btn-label-full">Storage / Mode Config</span>
            <span className="btn-label-short">Storage</span>
          </button>

          <button
            className="btn-secondary"
            onClick={onLogout}
            style={{
              padding: '9px 12px',
              background: 'rgba(225, 29, 72, 0.06)',
              borderColor: 'rgba(225, 29, 72, 0.2)',
              color: 'var(--accent-red)'
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Control Panel Grid */}
      <div className="control-grid">
        {/* Card 1: Tracking Engine */}
        <div className="glass-card control-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                TRACKING ENGINE
              </span>
              {isTracking ? (
                <span className="badge badge-green">
                  <div className="pulse-indicator" /> Active
                </span>
              ) : (
                <span className="badge badge-gray">⚪ Idle</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 'clamp(22px, 3vw, 26px)', fontWeight: '800', color: isTracking ? 'var(--accent-red)' : 'var(--text-muted)', letterSpacing: '-0.5px' }}>
                {isTracking ? 'Running' : 'Paused'}
              </div>

              <div style={{ color: isTracking ? 'var(--accent-red)' : 'var(--text-dim)', opacity: isTracking ? 1 : 0.4 }}>
                <svg width="48" height="24" viewBox="0 0 48 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M0 12h10l3-8 5 16 4-12 3 6h13" />
                </svg>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
              {isTracking
                ? 'Automated background capture is active and monitoring your screen.'
                : 'Automated background capture is currently paused.'}
            </p>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleToggleTracking}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                background: isTracking ? 'var(--accent-red)' : 'var(--accent-green)',
                boxShadow: isTracking ? '0 4px 14px rgba(225, 29, 72, 0.25)' : '0 4px 14px rgba(16, 185, 129, 0.25)'
              }}
            >
              {isTracking ? <Pause size={16} /> : <Play size={16} />}
              {isTracking ? 'Stop Auto Capture' : 'Start Auto Capture'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', justifyContent: 'center' }}>
              <ShieldCheck size={13} color="var(--accent-red)" />
              <span>System secure & monitoring</span>
            </div>
          </div>
        </div>

        {/* Card 2: Capture Interval */}
        <div className="glass-card control-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                CAPTURE INTERVAL
              </span>
            </div>

            <div style={{ fontSize: 'clamp(20px, 2.8vw, 24px)', fontWeight: '800', color: 'var(--text-dark)', letterSpacing: '-0.5px' }}>
              Every {intervalMinutes} Minutes
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
              {[1, 3, 5, 10].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleIntervalChange(mins)}
                  style={{
                    flex: '1 1 64px',
                    padding: '10px 4px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: intervalMinutes === mins ? 'var(--accent-red)' : 'var(--border-subtle)',
                    background: intervalMinutes === mins ? 'var(--accent-red)' : 'var(--bg-card)',
                    color: intervalMinutes === mins ? '#ffffff' : 'var(--text-main)',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: intervalMinutes === mins ? '0 3px 10px rgba(225, 29, 72, 0.25)' : 'none'
                  }}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Clock size={12} />
              <span>Interval is fully configurable from 1 to 60 minutes.</span>
            </div>

            <input
              type="range"
              className="custom-slider"
              min="1"
              max="60"
              value={intervalMinutes}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
              <span>1 min</span>
              <span>60 min</span>
            </div>
          </div>
        </div>

        {/* Card 3: Storage & Mode */}
        <div className="glass-card control-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isDemoMode ? <FolderOpen size={16} color="var(--text-muted)" /> : <Database size={16} color="var(--accent-green)" />}
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                  STORAGE & MODE
                </span>
              </div>
              {isDemoMode ? (
                <span className="badge badge-red">LOCAL MODE</span>
              ) : isDbLinked ? (
                <span className="badge badge-green">DB LINKED</span>
              ) : (
                <span className="badge badge-gray">NOT LINKED</span>
              )}
            </div>

            <div style={{ fontSize: 'clamp(15px, 2.2vw, 18px)', fontWeight: '800', color: 'var(--accent-red)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isDemoMode ? 'C:\\ScreenVaultCaptures' : storageConfig.bucketName}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
              {isDemoMode
                ? 'Screenshots are saved directly to local PC storage folder.'
                : `Linked to cloud provider: ${storageConfig.provider.toUpperCase()}`}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              {isDemoMode && (
                <button
                  className="btn-secondary"
                  onClick={() => handleOpenLocalFolder()}
                  style={{ flex: '1 1 120px', padding: '10px', justifyContent: 'center', fontSize: '12px' }}
                >
                  <FolderOpen size={14} /> Open Folder
                </button>
              )}
              <button
                className="btn-primary"
                onClick={handleCaptureNow}
                style={{ flex: '1 1 120px', padding: '10px', justifyContent: 'center', fontSize: '12px' }}
              >
                <Camera size={14} /> Capture Now
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <HardDrive size={13} color="var(--text-muted)" />
                <strong>{diskInfo.freeGb} GB Free</strong> of {diskInfo.totalGb} GB
              </span>
              <span>{intervalMinutes} min</span>
            </div>
            <div style={{ width: '100%', height: '5px', background: 'var(--border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(12, Math.round(((diskInfo.totalGb - diskInfo.freeGb) / Math.max(1, diskInfo.totalGb)) * 100)))}%`, height: '100%', background: 'var(--accent-red)', borderRadius: '3px' }} />
            </div>
          </div>
        </div>
      </div>

      <ActivityLog
        logs={logs}
        bucketName={storageConfig.bucketName}
        isDemoMode={isDemoMode}
        isDbLinked={isDbLinked}
        onRemoveLog={handleRemoveLog}
        onOpenFolder={handleOpenLocalFolder}
      />

      {showConfigModal && (
        <StorageConfigModal
          config={storageConfig}
          onSave={handleSaveStorageConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;


