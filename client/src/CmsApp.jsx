import { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import './styles/cms.css';
import { AuthGate, AuthProvider, useAuth } from './auth.jsx';
import { Signature } from './components/ui.jsx';
import Dashboard from './pages/cms/Dashboard.jsx';
import PageEditor from './pages/cms/PageEditor.jsx';
import Messages from './pages/cms/Messages.jsx';
import Media from './pages/cms/Media.jsx';
import { PAGE_LINKS } from './pages/cms/pageLinks.js';

// CMS (/cms): edit the site's texts and images, read the Contact page messages.
// English interface, styled with the mock-up's styleguide and UI kit.

function CmsLayout({ children }) {
  const { session, signOut } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const user = session?.user;

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="cms">
      <aside className={`cms-sidebar${menuOpen ? ' is-open' : ''}`}>
        <div className="cms-sidebar__top">
          <Link to="/cms" className="cms-brand">
            <span className="display cms-brand__name">REAL REEL DRAMA</span>
            <Signature>Content manager</Signature>
          </Link>
          <button type="button" className="menu-toggle cms-menu-toggle" aria-expanded={menuOpen} aria-controls="cms-nav" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((o) => !o)}>
            <span />
            <span />
            <span />
          </button>
        </div>
        <nav id="cms-nav" className="cms-nav" aria-label="CMS">
          <NavLink to="/cms" end className="cms-nav__link">
            <span className="cms-nav__dot cms-nav__dot--cream" />
            Dashboard
          </NavLink>
          <p className="cms-nav__title">Pages</p>
          {PAGE_LINKS.filter((p) => p.path).map((p) => (
            <NavLink key={p.key} to={`/cms/pages/${p.key}`} className="cms-nav__link">
              <span className={`cms-nav__dot cms-nav__dot--${p.color}`} />
              {p.name}
            </NavLink>
          ))}
          <p className="cms-nav__title">Library</p>
          <NavLink to="/cms/media" className="cms-nav__link">
            <span className="cms-nav__dot cms-nav__dot--peach" />
            Images
          </NavLink>
          <NavLink to="/cms/messages" className="cms-nav__link">
            <span className="cms-nav__dot cms-nav__dot--blush" />
            Messages
          </NavLink>
          <p className="cms-nav__title">Settings</p>
          <NavLink to="/cms/pages/site" className="cms-nav__link">
            <span className="cms-nav__dot cms-nav__dot--slate" />
            Site settings
          </NavLink>
        </nav>
        <div className="cms-sidebar__foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="link link--standalone cms-view-site">
            View the website ↗
          </a>
          {user && (
            <div className="cms-user">
              {user.picture ? (
                <img src={user.picture} alt="" width="36" height="36" className="cms-user__avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="cms-user__avatar cms-user__avatar--initial">{(user.name || user.email)[0].toUpperCase()}</span>
              )}
              <span className="cms-user__info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </span>
              <button type="button" className="btn btn--text btn--small cms-user__out" onClick={signOut}>
                <span className="btn__surface">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
      <div className="cms-main">
        {session && !session.authEnabled && (
          <div className="cms-warning">Sign-in is disabled (no GOOGLE_CLIENT_ID in server/.env): the CMS is open on this computer only. It can’t start like this in production.</div>
        )}
        <main className="cms-content">{children}</main>
      </div>
    </div>
  );
}

export default function CmsApp() {
  return (
    <AuthProvider>
      <AuthGate>
        <CmsLayout>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="pages/:key" element={<PageEditor />} />
            <Route path="media" element={<Media />} />
            <Route path="messages" element={<Messages />} />
            <Route path="*" element={<p className="text">This CMS page doesn’t exist.</p>} />
          </Routes>
        </CmsLayout>
      </AuthGate>
    </AuthProvider>
  );
}
