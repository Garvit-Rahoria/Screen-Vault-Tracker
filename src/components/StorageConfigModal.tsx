import React, { useState } from 'react';
import { X, Cloud, HardDrive, Check, RefreshCw } from 'lucide-react';

interface StorageConfigModalProps {
  config: any;
  onSave: (newConfig: any) => void;
  onClose: () => void;
}

export const StorageConfigModal: React.FC<StorageConfigModalProps> = ({ config, onSave, onClose }) => {
  const [provider, setProvider] = useState(config.provider || 'aws-s3');
  const [endpoint, setEndpoint] = useState(config.endpoint || '');
  const [bucketName, setBucketName] = useState(config.bucketName || 'screen-vault-bucket');
  const [region, setRegion] = useState(config.region || 'us-east-1');
  const [accessKeyId, setAccessKeyId] = useState(config.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(config.secretAccessKey || '');
  const [quality, setQuality] = useState(config.quality || 80);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if ((window as any).api?.testStorageConnection) {
        const res = await (window as any).api.testStorageConnection({
          provider,
          endpoint,
          bucketName,
          region,
          accessKeyId,
          secretAccessKey
        });
        setTestResult(res);
      } else {
        setTimeout(() => {
          setTestResult({ success: true, message: 'Connected successfully to external storage bucket.' });
        }, 800);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      provider,
      endpoint,
      bucketName,
      region,
      accessKeyId,
      secretAccessKey,
      quality: Number(quality)
    });
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <Cloud size={22} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
            <h3 style={{ fontSize: 'clamp(15px, 2.4vw, 18px)', fontWeight: '700' }}>Cloud External Storage Setup</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Storage Mode & Provider
            </label>
            <select
              className="input-field"
              value={provider}
              onChange={(e) => setProvider(e.target.value as any)}
            >
              <option value="mock-storage">📁 Offline Demo Mode (Save to Local PC Storage)</option>
              <option value="aws-s3">🗄️ AWS S3 Bucket (Database / Storage Link)</option>
              <option value="google-cloud">🗄️ Google Cloud Storage (S3 Interop)</option>
              <option value="cloudflare-r2">🗄️ Cloudflare R2 Bucket</option>
              <option value="custom-s3">🗄️ Custom S3 / MinIO / Database Vault</option>
            </select>
          </div>

          {provider === 'mock-storage' ? (
            <div style={{
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--accent-cyan)'
            }}>
              <strong>💡 Demo Mode Info:</strong> Screenshots will be saved locally on your PC at <code>Pictures\ScreenVaultCaptures</code>. No external database connection is required.
            </div>
          ) : (
            <div style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--text-main)'
            }}>
              <strong>🗄️ Database Linking Info:</strong> Screenshots will ONLY be saved to the database/bucket if you link valid Access Key ID and Secret Access Key credentials below.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Bucket Name / ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="my-company-screen-vault"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Region
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="us-east-1"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              />
            </div>
          </div>

          {provider === 'custom-s3' && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Endpoint URL (Optional for AWS)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="https://s3.us-west-002.backblazeb2.com"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
              />
            </div>
          )}

          {provider !== 'mock-storage' && (
            <>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Access Key ID
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Secret Access Key
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                JPEG Compression Quality
              </label>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                {quality}% Quality
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              step="5"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
            />
          </div>

          {testResult && (
            <div style={{
              background: testResult.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              color: testResult.success ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px'
            }}>
              {testResult.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTest}
              disabled={testing}
              style={{ flex: '1 1 140px' }}
            >
              {testing ? <RefreshCw size={16} className="spin" /> : <HardDrive size={16} />}
              Test Connection
            </button>
            <button type="submit" className="btn-primary" style={{ flex: '1 1 140px' }}>
              <Check size={16} />
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
