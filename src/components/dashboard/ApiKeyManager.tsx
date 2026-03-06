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
  const [copied, setCopied] = useState(false);

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
    if (!newKeyName.trim()) return;

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

  function copyKey(key: string) {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <p className="dash-muted">Loading keys...</p>;

  return (
    <div>
      <h3 className="dash-section-title">API Keys</h3>

      {tier === 'free' && (
        <div className="dash-info-banner">
          <strong>Free tier</strong> — 60 requests/min.{' '}
          <a href="https://skytools.app/pricing">Upgrade for higher limits →</a>
        </div>
      )}

      {createdKey && (
        <div className="dash-success-banner">
          <div className="dash-success-header">
            <strong>Key created!</strong> Copy it now — it won't be shown again.
          </div>
          <div className="dash-key-display">
            <code>{createdKey}</code>
            <button onClick={() => copyKey(createdKey)} className="dash-btn-sm dash-btn-primary">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={() => setCreatedKey(null)} className="dash-btn-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="dash-create-row">
        <input
          type="text"
          placeholder="Key name (e.g. My Bot)"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createKey()}
          className="dash-input"
        />
        <button onClick={createKey} className="dash-btn dash-btn-primary">
          Create Key
        </button>
      </div>

      {keys.length === 0 ? (
        <p className="dash-muted">No API keys yet. Create one above to get started.</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td className="dash-key-name">{k.name}</td>
                  <td>
                    <code className="dash-key-preview">
                      {k.key.slice(0, 7)}...{k.key.slice(-4)}
                    </code>
                  </td>
                  <td>
                    <span className={`dash-badge ${k.is_active ? 'dash-badge-active' : 'dash-badge-revoked'}`}>
                      {k.is_active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="dash-muted-cell">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {k.is_active ? (
                      <button onClick={() => revokeKey(k.id)} className="dash-btn-sm dash-btn-danger">
                        Revoke
                      </button>
                    ) : (
                      <button onClick={() => deleteKey(k.id)} className="dash-btn-sm dash-btn-danger">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="dash-quickstart">
        <h4>Quick Start</h4>
        <pre><code>{`const res = await fetch('https://api.skytools.app/v1/bazaar', {
  headers: { 'X-API-Key': '${keys.find(k => k.is_active)?.key.slice(0, 7) || 'sk_'}...' }
});
const data = await res.json();`}</code></pre>
      </div>
    </div>
  );
}
