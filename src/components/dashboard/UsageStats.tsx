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

  if (loading) return <p className="dash-muted">Loading usage stats...</p>;

  const maxCount = Math.max(...dailyUsage.map((d) => d.count), 1);

  return (
    <div>
      <h3 className="dash-section-title">Usage</h3>

      <div className="dash-stat-row">
        <div className="dash-stat-card">
          <div className="dash-stat-value">{totalRequests.toLocaleString()}</div>
          <div className="dash-stat-label">Requests (30 days)</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value">{rateLimit}</div>
          <div className="dash-stat-label">Rate limit (req/min) · {tierName}</div>
        </div>
      </div>

      <h4 className="dash-chart-title">Last 7 days</h4>
      <div className="dash-chart">
        {dailyUsage.map((d) => (
          <div key={d.date} className="dash-chart-bar-col">
            <div className="dash-chart-count">
              {d.count || ''}
            </div>
            <div
              className="dash-chart-bar"
              style={{ height: `${Math.max((d.count / maxCount) * 80, 2)}px` }}
            />
            <div className="dash-chart-label">
              {d.date.slice(5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
