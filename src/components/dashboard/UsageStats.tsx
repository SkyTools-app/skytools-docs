import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DailyUsage {
  date: string;
  count: number;
}

const RATE_LIMITS: Record<string, number> = {
  free: 60,
  starter: 120,
  pro: 300,
};

export function UsageStats({ userId }: { userId: string }) {
  const [totalRequests, setTotalRequests] = useState(0);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [rateLimit, setRateLimit] = useState(60);
  const [tierName, setTierName] = useState('Free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
    loadUsage();
  }, []);

  async function loadSubscription() {
    const { data } = await supabase
      .from('user_subscriptions')
      .select('status, tier')
      .eq('user_id', userId)
      .maybeSingle();

    let tier = 'free';
    if (data?.status === 'premium') {
      tier = (data.tier === 'pro' || data.tier === 'starter') ? data.tier : 'pro';
    }

    setRateLimit(RATE_LIMITS[tier] || 60);
    setTierName(tier === 'pro' ? 'Pro' : tier === 'starter' ? 'Starter' : 'Free');
  }

  async function loadUsage() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const { data, count } = await supabase
      .from('api_usage')
      .select('created_at', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    setTotalRequests(count || 0);

    // Group by day
    const byDay: Record<string, number> = {};
    for (const row of data || []) {
      const day = new Date(row.created_at).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    }

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      return { date: d, count: byDay[d] || 0 };
    }).reverse();

    setDailyUsage(last7);
    setLoading(false);
  }

  if (loading) return <p>Loading usage stats...</p>;

  const maxCount = Math.max(...dailyUsage.map((d) => d.count), 1);

  return (
    <div>
      <h3 style={{ marginBottom: '1rem' }}>Usage Stats</h3>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
        <div style={statBoxStyle}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalRequests.toLocaleString()}</div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>Requests (30d)</div>
        </div>
        <div style={statBoxStyle}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rateLimit}</div>
          <div style={{ color: '#888', fontSize: '0.75rem' }}>Rate Limit (req/min) · {tierName}</div>
        </div>
      </div>

      <h4 style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#888' }}>Last 7 Days</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: 120 }}>
        {dailyUsage.map((d) => (
          <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '0.625rem', color: '#888', marginBottom: 4 }}>
              {d.count || ''}
            </div>
            <div
              style={{
                width: '100%',
                height: `${Math.max((d.count / maxCount) * 80, 2)}px`,
                backgroundColor: '#6366f1',
                borderRadius: '2px 2px 0 0',
              }}
            />
            <div style={{ fontSize: '0.625rem', color: '#666', marginTop: 4 }}>
              {d.date.slice(5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const statBoxStyle: React.CSSProperties = {
  padding: '1rem',
  backgroundColor: '#1a1a2e',
  borderRadius: '0.5rem',
  flex: 1,
};
