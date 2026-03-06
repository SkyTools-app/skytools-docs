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
    return <p className="dash-loading">Loading...</p>;
  }

  if (!user) {
    return <AuthGate><div /></AuthGate>;
  }

  return (
    <div className="dash-container">
      <div className="dash-header">
        <div>
          <p className="dash-email">{user.email}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="dash-signout">
          Sign Out
        </button>
      </div>

      <div className="dash-sections">
        <ApiKeyManager userId={user.id} />
        <hr className="dash-divider" />
        <UsageStats userId={user.id} />
      </div>
    </div>
  );
}
