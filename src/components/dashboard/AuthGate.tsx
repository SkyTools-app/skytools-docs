import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
    }
    setLoading(false);
  }

  async function handleOAuth(provider: 'google' | 'discord') {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
  }

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ marginBottom: '1rem' }}>
        {isSignUp ? 'Create Account' : 'Sign In'}
      </h2>
      <p style={{ marginBottom: '1.5rem', color: '#888' }}>
        Sign in with your SkyTools account to manage API keys.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => handleOAuth('google')}
          style={oauthBtnStyle}
        >
          Google
        </button>
        <button
          onClick={() => handleOAuth('discord')}
          style={oauthBtnStyle}
        >
          Discord
        </button>
      </div>

      <div style={{ textAlign: 'center', margin: '1rem 0', color: '#666' }}>or</div>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}
        <button type="submit" disabled={loading} style={submitBtnStyle}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '0.5rem 0.75rem',
  marginBottom: '0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid #333',
  backgroundColor: '#1a1a2e',
  color: '#e2e8f0',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '0.375rem',
  border: 'none',
  backgroundColor: '#6366f1',
  color: 'white',
  cursor: 'pointer',
  fontSize: '0.875rem',
  fontWeight: 600,
};

const oauthBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '0.5rem',
  borderRadius: '0.375rem',
  border: '1px solid #333',
  backgroundColor: '#1a1a2e',
  color: '#e2e8f0',
  cursor: 'pointer',
  fontSize: '0.875rem',
};
