import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { usePage, useDocumentTitle } from '../lib/usePage.js';
import { Loader, Signature, TextLink } from './ui.jsx';

// Layout of the public site: header (Header / REAL REEL DRAMA), content, footer (Footer / REAL REEL DRAMA).
// The shared settings (brand, footer, social links) come from CMS › Site settings.

// Values used until the settings arrive from the server
const FALLBACK_SITE = {
  identity: { siteName: 'REAL REEL DRAMA', signature: 'Verticals & all the feelings' },
  footer: { closing: '', text: '', socialTitle: '', copyright: 'REAL REEL DRAMA', colophon: '' },
  social: { links: [] },
};

const SiteContext = createContext(FALLBACK_SITE);
export const useSite = () => useContext(SiteContext);

// Menu of the mock-up header
const NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

// Scrolls on each address change: to the anchor (#unscripted…) once the page is shown, otherwise to the top
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return undefined;
    }
    let tries = 0;
    const timer = setInterval(() => {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (target || ++tries > 40) {
        clearInterval(timer);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
    return () => clearInterval(timer);
  }, [pathname, hash]);
  return null;
}

function Brand({ as: Tag = 'p', className = '' }) {
  const site = useSite();
  return (
    <span className={`brand ${className}`}>
      <Tag className="display brand__name">{site.identity.siteName}</Tag>
      <Signature>{site.identity.signature}</Signature>
    </span>
  );
}

function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="Real Reel Drama, home">
          <Brand />
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Main menu">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end className="link site-nav__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const site = useSite();
  const { footer } = site;
  const socials = site.social.links.filter((s) => s.label);
  return (
    <footer className="site-footer">
      <div className="site-footer__rule" />
      <div className="site-footer__content">
        <div className="site-footer__top">
          <div className="site-footer__closing">
            <Brand />
            {footer.closing && <p className="script site-footer__script">{footer.closing}</p>}
            {footer.text && <p className="site-footer__text">{footer.text}</p>}
          </div>
          {socials.length > 0 && (
            <div className="site-footer__social">
              {footer.socialTitle && <p className="caps site-footer__title">{footer.socialTitle}</p>}
              <ul className="site-footer__links">
                {socials.map((s, i) => (
                  <li key={`${s.label}${i}`}>
                    <TextLink href={s.url} standalone>
                      {s.label}
                    </TextLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="site-footer__divider" />
        <div className="site-footer__colophon">
          <p className="site-footer__copyright">
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          {footer.colophon && <p className="script site-footer__colophon-note">{footer.colophon}</p>}
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { data } = usePage('site');
  const site = data?.content ?? FALLBACK_SITE;
  return (
    <SiteContext.Provider value={site}>
      <div className="site">
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <ScrollManager />
        <Header />
        <main id="content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteContext.Provider>
  );
}

// Loads the content of a page then shows it; tab title included.
// children(content) receives the sections of the page (see server/src/data/pages.js).
export function PageContent({ pageKey, children }) {
  const { data, error } = usePage(pageKey);
  useDocumentTitle(data?.seo?.title);

  if (data) return children(data.content);
  return (
    <div className="page-state">
      {error ? (
        <>
          <h1 className="display page-state__title">Something went wrong</h1>
          <p className="text">This page couldn’t be loaded ({error.message}). Please try again in a moment.</p>
        </>
      ) : (
        <Loader />
      )}
    </div>
  );
}
