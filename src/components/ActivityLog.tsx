import React, { useState } from 'react';
import {
  Clock, FileImage, Trash2, FolderOpen,
  Calendar, PieChart, TrendingUp, Camera, Play, ArrowLeft, ArrowRight,
  Code, Layout, Chrome, FileSpreadsheet, Presentation, Monitor
} from 'lucide-react';
import { ScreenshotModal } from './ScreenshotModal';

export interface ActivityItem {
  id: number;
  timestamp: string;
  status: 'capturing' | 'uploading' | 'success' | 'error';
  filename: string;
  sizeKb: number;
  reason: 'timer' | 'manual';
  appName?: string;
  processName?: string;
  previewUrl?: string;
  destination?: string;
  localPath?: string;
  message?: string;
}

interface ActivityLogProps {
  logs: ActivityItem[];
  bucketName: string;
  isDemoMode?: boolean;
  isDbLinked?: boolean;
  onRemoveLog?: (id: number) => void;
  onOpenFolder?: (path?: string) => void;
}

// Resolve icon / color from the real process name — never fake apps by row index
const APP_PRESETS = [
  { name: 'Visual Studio Code', process: 'Code.exe', match: ['code'], icon: Code, color: '#007acc' },
  { name: 'Cursor', process: 'Cursor.exe', match: ['cursor'], icon: Code, color: '#00a86b' },
  { name: 'Figma', process: 'figma.exe', match: ['figma'], icon: Layout, color: '#a259ff' },
  { name: 'Google Chrome', process: 'chrome.exe', match: ['chrome'], icon: Chrome, color: '#ea4335' },
  { name: 'Microsoft Edge', process: 'msedge.exe', match: ['msedge', 'edge'], icon: Chrome, color: '#0078d4' },
  { name: 'Microsoft Excel', process: 'excel.exe', match: ['excel'], icon: FileSpreadsheet, color: '#107c41' },
  { name: 'Microsoft PowerPoint', process: 'powerpnt.exe', match: ['powerpnt', 'powerpoint'], icon: Presentation, color: '#c43e1c' },
  { name: 'Microsoft Word', process: 'winword.exe', match: ['winword', 'word'], icon: FileSpreadsheet, color: '#2b579a' }
];

function resolveAppMeta(processName?: string, appName?: string) {
  const proc = (processName || '').toLowerCase().replace(/\.exe$/, '');
  const title = (appName || '').toLowerCase();
  const preset = APP_PRESETS.find(
    (p) => p.match.some((m) => proc.includes(m) || title.includes(m))
  );
  return {
    name: appName || preset?.name || (processName ? processName.replace(/\.exe$/i, '') : 'Unknown App'),
    process: processName || preset?.process || 'app.exe',
    icon: preset?.icon || Monitor,
    color: preset?.color || '#e11d48'
  };
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  logs,
  bucketName,
  isDemoMode = true,
  onRemoveLog,
  onOpenFolder
}) => {
  const [selectedLog, setSelectedLog] = useState<ActivityItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Dynamic Metrics Calculations
  const totalCount = logs.length;
  
  const todayCount = logs.filter((l) => {
    if (!l.timestamp) return false;
    const nowStr = new Date().toLocaleDateString();
    return l.timestamp.includes(nowStr) || l.timestamp.toLowerCase().includes('today');
  }).length || (logs.length > 0 ? logs.length : 0);

  const lastCaptureText = logs.length > 0 ? logs[0].timestamp : 'No captures yet';

  const totalKb = logs.reduce((acc, curr) => acc + (curr.sizeKb || 0), 0);
  const storageUsedText = totalKb > 1024
    ? `${(totalKb / 1024).toFixed(1)} MB`
    : `${totalKb} KB`;

  const totalPages = Math.max(1, Math.ceil(logs.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const currentLogs = logs.slice(startIdx, startIdx + pageSize);

  return (
    <>
      <div className="glass-card activity-panel">
        <div className="activity-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <FolderOpen size={20} color="var(--accent-red)" style={{ flexShrink: 0 }} />
            <h3 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isDemoMode ? 'Live Capture Log (Local PC Mode)' : 'Live Capture Log (Linked Database Mode)'}
            </h3>
          </div>

          <div className="activity-toolbar-actions">
            {isDemoMode && onOpenFolder && (
              <button
                onClick={() => onOpenFolder()}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  color: 'var(--accent-red)',
                  borderColor: 'rgba(225, 29, 72, 0.25)',
                  background: 'rgba(225, 29, 72, 0.04)'
                }}
              >
                <FolderOpen size={14} />
                <span className="btn-label-full">Open Capture Folder</span>
                <span className="btn-label-short">Folder</span>
              </button>
            )}
            <span className="badge badge-gray" style={{ background: 'var(--bg-muted)', padding: '6px 12px' }}>
              {isDemoMode ? 'Saved to PC' : `Bucket: ${bucketName}`}
            </span>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Camera size={18} color="var(--accent-red)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{totalCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Total Captures</div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(225, 29, 72, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={18} color="var(--accent-red)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{todayCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Today Captures</div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Clock size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-red)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lastCaptureText}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Last Capture</div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PieChart size={18} color="#f59e0b" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{storageUsedText}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Storage Used</div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TrendingUp size={18} color="var(--accent-green)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-dark)' }}>{totalCount}</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-green)' }}>↑ Live</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>This Week</div>
            </div>
          </div>
        </div>

        {/* Desktop / tablet table */}
        <div className="table-scroll">
          <table className="activity-table">
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>
                <th style={{ width: '100px' }}>PREVIEW</th>
                <th>TIME CAPTURED ↕</th>
                <th>ACTIVE WINDOW / APP</th>
                <th>DURATION</th>
                <th>SIZE</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={24} color="var(--text-dim)" />
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)' }}>No captures yet</div>
                      <div style={{ fontSize: '12px', maxWidth: '320px', lineHeight: 1.5 }}>
                        Start Auto Capture or click Capture Now — live entries will appear here.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => {
                  const meta = resolveAppMeta(log.processName, log.appName);
                  const IconComp = meta.icon;
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td>
                        {log.previewUrl ? (
                          <img
                            src={log.previewUrl}
                            alt="preview"
                            onClick={() => setSelectedLog(log)}
                            style={{ width: '64px', height: '42px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-subtle)' }}
                          />
                        ) : (
                          <div style={{ width: '64px', height: '42px', borderRadius: '8px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileImage size={18} color="var(--text-dim)" />
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{log.filename}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.timestamp}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <IconComp size={16} color={meta.color} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{meta.process}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {log.reason === 'manual' ? 'Manual' : '10 min'}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {log.sizeKb > 0 ? `${log.sizeKb} KB` : '—'}
                      </td>
                      <td>
                        {log.status === 'success' && <span className="badge badge-green">🟢 Saved</span>}
                        {log.status === 'uploading' && <span className="badge badge-gray">☁️ Syncing</span>}
                        {log.status === 'error' && <span className="badge badge-red">❌ Failed</span>}
                        {log.status === 'capturing' && <span className="badge badge-gray">📸 Capturing</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" style={{ padding: '5px 8px' }} onClick={() => setSelectedLog(log)} title="View Screenshot"><Play size={13} /></button>
                          {log.localPath && onOpenFolder && (
                            <button className="btn-secondary" style={{ padding: '5px 8px' }} onClick={() => onOpenFolder(log.localPath)} title="Show in Explorer"><FolderOpen size={13} /></button>
                          )}
                          {onRemoveLog && (
                            <button className="btn-secondary" style={{ padding: '5px 8px', color: 'var(--accent-red)' }} onClick={() => onRemoveLog(log.id)} title="Delete Log"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="activity-cards">
          {logs.length === 0 ? (
            <div style={{ padding: '36px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-dark)', marginBottom: '6px' }}>No captures yet</div>
              <div style={{ fontSize: '12px', lineHeight: 1.5 }}>Start Auto Capture or click Capture Now.</div>
            </div>
          ) : (
            currentLogs.map((log) => {
              const meta = resolveAppMeta(log.processName, log.appName);
              const IconComp = meta.icon;
              return (
                <div key={`card-${log.id}`} className="activity-card-item">
                  <div className="activity-card-top">
                    {log.previewUrl ? (
                      <img
                        src={log.previewUrl}
                        alt="preview"
                        onClick={() => setSelectedLog(log)}
                        style={{ width: '72px', height: '48px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--border-subtle)', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: '72px', height: '48px', borderRadius: '8px', background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileImage size={18} color="var(--text-dim)" />
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '13px', wordBreak: 'break-word' }}>{log.filename}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.timestamp}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <IconComp size={14} color={meta.color} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{meta.process}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="activity-card-meta">
                    <div><span style={{ color: 'var(--text-muted)' }}>Duration:</span> <strong>{log.reason === 'manual' ? 'Manual' : '10 min'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Size:</span> <strong>{log.sizeKb > 0 ? `${log.sizeKb} KB` : '—'}</strong></div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                      {log.status === 'success' && <span className="badge badge-green">Saved</span>}
                      {log.status === 'uploading' && <span className="badge badge-gray">Syncing</span>}
                      {log.status === 'error' && <span className="badge badge-red">Failed</span>}
                      {log.status === 'capturing' && <span className="badge badge-gray">Capturing</span>}
                    </div>
                  </div>

                  <div className="activity-card-actions">
                    <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => setSelectedLog(log)}><Play size={13} /> View</button>
                    {log.localPath && onOpenFolder && (
                      <button className="btn-secondary" style={{ padding: '7px 10px' }} onClick={() => onOpenFolder(log.localPath)}><FolderOpen size={13} /> Folder</button>
                    )}
                    {onRemoveLog && (
                      <button className="btn-secondary" style={{ padding: '7px 10px', color: 'var(--accent-red)' }} onClick={() => onRemoveLog(log.id)}><Trash2 size={13} /> Delete</button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="activity-footer">
          <div>
            {logs.length === 0
              ? 'No entries yet'
              : `Showing ${startIdx + 1} to ${Math.min(startIdx + pageSize, logs.length)} of ${logs.length} entries`}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft size={13} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
              <button
                key={pNum}
                onClick={() => setCurrentPage(pNum)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: currentPage === pNum ? 'var(--accent-red)' : 'var(--bg-muted)',
                  color: currentPage === pNum ? '#fff' : 'var(--text-dark)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {pNum}
              </button>
            ))}

            <button
              className="btn-secondary"
              style={{ padding: '6px 10px' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      <ScreenshotModal item={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};


