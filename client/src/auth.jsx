import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, UNAUTHORIZED_EVENT } from './lib/api.js';
import Login from './pages/cms/Login.jsx';
import { Loader } from './components/ui.jsx';

// CMS sign-in (Google), taken from I Love Verticals. The public site doesn't use it.
// - authEnabled: false if the server has no GOOGLE_CLIENT_ID (local development)
// - clientId: OAuth id given to the Google button; user: { email, name, picture } or null
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // null = check in progress
  const [error, setError] = useState('');

  const refresh = useCallback(() => {
    setError('');
    authApi
      .session()
      .then(setSession)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(refresh, [refresh]);

  // A rejected request (401, expired session) sends back to the sign-in page
  useEffect(() => {
    const onUnauthorized = () => setSession((prev) => (prev ? { ...prev, user: null } : prev));
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const signIn = useCallback(async (credential) => {
    const { user } = await authApi.google(credential);
    setSession((prev) => ({ ...prev, user }));
  }, []);

  const signOut = async () => {
    await authApi.logout().catch(() => {});
    window.google?.accounts.id.disableAutoSelect(); // no automatic sign-in again
    setSession((prev) => ({ ...prev, user: null }));
  };

  return <AuthContext.Provider value={{ session, error, signIn, signOut, retry: refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// Only shows the CMS once signed in (or if authentication is disabled)
export function AuthGate({ children }) {
  const { session, error, retry } = useAuth();
  if (!session) {
    return (
      <div className="cms-splash">
        {error ? (
          <p className="text">
            Can’t reach the server ({error}).{' '}
            <button type="button" className="link-button" onClick={retry}>
              Try again
            </button>
          </p>
        ) : (
          <Loader />
        )}
      </div>
    );
  }
  if (session.authEnabled && !session.user) return <Login clientId={session.clientId} />;
  return children;
}
