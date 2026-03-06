import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  status: string;
  tier: string;
}

export function ApiKeyManager({ userId }: { userId: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
    loadSubscription();
  }, []);

  async function loadSubscription() {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('status, tier')
      .eq('user_id', userId)
      .maybeSingle();

    setSubscription(data);
  }

  const tier = subscription?.status === 'premium' ? (subscription?.tier || 'free') : 'free';
  const canCreateKeys = true; // All tiers can create API keys

  async function loadKeys() {
    const { data } = await supabase
      .from('api_keys')
      .select('id, name, key, is_active, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setKeys(data || []);
    setLoading(false);
  }

  async function createKey() {
    if (!newKeyName.trim() || !canCreateKeys) return;

    const key = `sk_${crypto.randomUUID().replace(/-/g, '')}`;
    const { error } = await supabase.from('api_keys').insert({
      user_id: userId,
      name: newKeyName.trim(),
      key,
      is_active: true,
    });

    if (!error) {
      setCreatedKey(key);
      setNewKeyName('');
      loadKeys();
    }
  }

  async function revokeKey(id: string) {
    await supabase.from('api_keys').update({ is_active: false }).eq('id', id);
    loadKeys();
  }

  async function deleteKey(id: string) {
    await supabase.from('api_keys').delete().eq('id', id);
    loadKeys();
  }

  if (loading) return <p>Loading keys...</p>;

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>API Keys</h3>

      {tier === 'free' && (
        <div style={infoStyle}>
          <strong>Free tier:</strong> 60 req/min. Upgrade to Starter (120 req/min) or Pro (300 req/min) for higher limits.
          <br />
          <a href="https://skytools.app/pricing" style={{ color: '#6366f1', marginTop: '0.5rem', display: 'inline-block' }}>
            View plans →
          </a>
        </div>
      )}

      {createdKey && (
        <div style={alertStyle}>
          <strong>New key created!</strong> Copy it now — it won't be shown again.
          <code style={codeStyle}>{createdKey}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(createdKey);
            }}
            style={smallBtnStyle}
          >
            Copy
          </button>
          <button onClick={() => setCreatedKey(null)} style={smallBtnStyle}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', opacity: canCreateKeys ? 1 : 0.5 }}>
        <input
          type="text"
          placeholder="Key name (e.g. My Bot)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
          disabled={!canCreateKeys}
        />
        <button onClick={createKey} style={createBtnStyle} disabled={!canCreateKeys}>
          Create Key
        </button>
      </div>

      {keys.length === 0 ? (
        <p style={{ color: '#888' }}>No API keys yet. Create one above.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', textAlign: 'left' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Key</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={tdStyle}>{k.name}</td>
                <td style={tdStyle}>
                  <code style={{ fontSize: '0.75rem' }}>
                    {k.key.slice(0, 7)}...{k.key.slice(-4)}
                  </code>
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      color: k.is_active ? '#22c55e' : '#ef4444',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  >
                    {k.is_active ? 'Active' : 'Revoked'}
                  </span>
                </td>
                <td style={tdStyle}>
                  {new Date(k.created_at).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  {k.is_active && (
                    <button onClick={() => revokeKey(k.id)} style={dangerBtnStyle}>
                      Revoke
                    </button>
                  )}
                  {!k.is_active && (
                    <button onClick={() => deleteKey(k.id)} style={dangerBtnStyle}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#1a1a2e', borderRadius: '0.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem' }}>Quick Start</h4>
        <pre style={{ fontSize: '0.8rem', overflow: 'auto' }}>
{`const res = await fetch('https://api.skytools.app/v1/bazaar', {
  headers: { 'X-API-Key': '${keys.find(k => k.is_active)?.key.slice(0, 7) || 'sk_'}...' }
});
const data = await res.json();`}
        </pre>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid #333',
  backgroundColor: '#1a1a2e',
  color: '#e2e8f0',
  fontSize: '0.875rem',
};

const createBtnStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.375rem',
  border: 'none',
  backgroundColor: '#6366f1',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const dangerBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #ef4444',
  backgroundColor: 'transparent',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '0.75rem',
};

const smallBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #6366f1',
  backgroundColor: 'transparent',
  color: '#6366f1',
  cursor: 'pointer',
  fontSize: '0.75rem',
  marginLeft: '0.5rem',
};

const alertStyle: React.CSSProperties = {
  padding: '1rem',
  marginBottom: '1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#1a2e1a',
  border: '1px solid #22c55e',
};

const infoStyle: React.CSSProperties = {
  padding: '1rem',
  marginBottom: '1rem',
  borderRadius: '0.5rem',
  backgroundColor: '#1a1a2e',
  border: '1px solid #6366f1',
};

const codeStyle: React.CSSProperties = {
  display: 'block',
  padding: '0.5rem',
  marginTop: '0.5rem',
  marginBottom: '0.5rem',
  backgroundColor: '#0d1117',
  borderRadius: '0.25rem',
  fontSize: '0.8rem',
  wordBreak: 'break-all',
};

const thStyle: React.CSSProperties = { padding: '0.5rem', fontSize: '0.75rem', color: '#888' };
const tdStyle: React.CSSProperties = { padding: '0.5rem', fontSize: '0.875rem' };
