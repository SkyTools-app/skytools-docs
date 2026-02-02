import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AuthGate } from './AuthGate';
import { ApiKeyManager } from './ApiKeyManager';
import { UsageStats } from './UsageStats';
import type { User } from '@supabase/supabase-js';

export default function DashboardApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>;
  }

  if (!user) {
    return <AuthGate><div /></AuthGate>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0 }}>Developer Dashboard</h2>
          <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>{user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #333',
            backgroundColor: 'transparent',
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <ApiKeyManager userId={user.id} />
        <hr style={{ border: 'none', borderTop: '1px solid #222' }} />
        <UsageStats userId={user.id} />
      </div>
    </div>
  );
}
