import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { Alert, Signature } from '../../components/ui.jsx';
import sparkles from '../../assets/icons/sparkles.svg';

// hl=en: English button, like the rest of the interface
const GOOGLE_SCRIPT = 'https://accounts.google.com/gsi/client?hl=en';

// Loads the "Sign in with Google" script (Google Identity Services) only once
let scriptPromise = null;
function loadGoogleScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Couldn’t load Google sign-in. Check your connection.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// CMS sign-in page: the Google button opens a sign-in window; Google sends back an
// identity token that the server checks before opening the session (no password here).
export default function Login({ clientId }) {
  const { signIn } = useAuth();
  const buttonRef = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Sign in · Real Reel Drama CMS';
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: 'popup',
          callback: async ({ credential }) => {
            setBusy(true);
            setError('');
            try {
              await signIn(credential);
            } catch (err) {
              setError(err.message);
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(buttonRef.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'en' });
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [clientId, signIn]);

  return (
    <main className="cms-login">
      <div className="cms-login__card">
        <p className="display cms-login__brand">REAL REEL DRAMA</p>
        <Signature>Content manager</Signature>
        <p className="script cms-login__hello">
          Welcome back! <img src={sparkles} width="28" height="28" alt="" />
        </p>
        <p className="text">Sign in with an authorized Google account to edit the website.</p>
        <div ref={buttonRef} className="cms-login__button" aria-busy={busy} />
        {busy && <p className="text-s">Signing in…</p>}
        {error && (
          <Alert tone="error" title="Sign-in failed">
            {error}
          </Alert>
        )}
      </div>
    </main>
  );
}
