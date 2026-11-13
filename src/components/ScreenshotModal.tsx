import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Clock, FileImage, HardDrive, FolderOpen } from 'lucide-react';
import { ActivityItem } from './ActivityLog';

interface ScreenshotModalProps {
  item: ActivityItem | null;
  onClose: () => void;
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleDownload = () => {
    if (!item.previewUrl) return;
    const a = document.createElement('a');
    a.href = item.previewUrl;
    a.download = item.filename || `screenshot_${item.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = () => {
    if (!item.previewUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${item.previewUrl}" style="max-width: 100%; height: auto; display: block; margin: 20px auto; background: #111;" />`);
      win.document.title = item.filename;
    }
  };

  const handleOpenFolder = () => {
    if ((window as any).api?.openLocalFolder) {
      (window as any).api.openLocalFolder(item.localPath);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        backgroundColor: 'rgba(5, 8, 16, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '1000px',
          maxHeight: 'min(92vh, 92dvh)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          background: 'var(--bg-card)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              padding: '8px',
              borderRadius: '10px',
              background: 'var(--accent-red-light)',
              color: 'var(--accent-red)',
              display: 'flex'
            }}>
              <FileImage size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-main)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.filename}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {item.timestamp}
                </span>
                {item.sizeKb > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HardDrive size={13} /> {item.sizeKb} KB
                  </span>
                )}
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: item.reason === 'manual' ? 'rgba(225, 29, 72, 0.15)' : 'var(--bg-muted)',
                  color: item.reason === 'manual' ? 'var(--accent-red)' : 'var(--text-muted)'
                }}>
                  {item.reason === 'manual' ? 'Manual Capture' : 'Auto Timer'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
              e.currentTarget.style.color = 'var(--accent-rose)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Preview Body */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.4)',
            minHeight: '300px'
          }}
        >
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.filename}
              style={{
                maxWidth: '100%',
                maxHeight: '65vh',
                objectFit: 'contain',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '40px' }}>
              <FileImage size={48} strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: '12px' }} />
              <p style={{ fontSize: '15px' }}>No direct image preview available for this log entry.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Status: <strong style={{ color: item.status === 'success' ? 'var(--accent-emerald)' : 'var(--accent-red)' }}>
              {item.status.toUpperCase()}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {item.localPath && (
              <button
                onClick={handleOpenFolder}
                style={{
                  background: 'rgba(2, 132, 199, 0.12)',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  color: 'var(--accent-cyan)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FolderOpen size={15} />
                <span className="btn-label-full">Show in Windows Explorer</span>
                <span className="btn-label-short">Explorer</span>
              </button>
            )}

            {item.previewUrl && (
              <>
                <button
                  onClick={handleOpenNewTab}
                  className="btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px'
                  }}
                >
                  <ExternalLink size={15} />
                  <span className="btn-label-full">Open Full Window</span>
                  <span className="btn-label-short">Open</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="btn-primary"
                  style={{
                    padding: '8px 18px',
                    fontSize: '13px'
                  }}
                >
                  <Download size={15} />
                  <span>Download</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
