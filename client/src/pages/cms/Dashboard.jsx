import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { cmsMediaApi, cmsMessagesApi, cmsPagesApi } from '../../lib/api.js';
import { useAuth } from '../../auth.jsx';
import { Alert, Loader, Tag, TextLink } from '../../components/ui.jsx';
import { formatDate } from './format.js';
import { PAGE_LINKS, pageColor } from './pageLinks.js';
import { CmsHeader } from './CmsHeader.jsx';

// Dashboard: every page of the site, unread messages and image library at a glance
export default function Dashboard() {
  const { session } = useAuth();
  const [pages, setPages] = useState(null);
  const [messages, setMessages] = useState(null);
  const [images, setImages] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard · Real Reel Drama CMS';
    // Same order as the menu: the pages, then the site settings
    const order = (p) => PAGE_LINKS.findIndex((l) => l.key === p.key);
    cmsPagesApi
      .list()
      .then((list) => setPages([...list].sort((a, b) => order(a) - order(b)))).catch((err) => setError(err.message));
    cmsMessagesApi.list().then(setMessages).catch(() => setMessages(null));
    cmsMediaApi.list().then(setImages).catch(() => setImages(null));
  }, []);

  const unread = messages?.filter((m) => !m.read).length ?? 0;
  const firstName = session?.user?.name?.split(' ')[0];

  return (
    <div className="cms-page">
      <CmsHeader overline="CONTENT MANAGER" title="Dashboard" note={firstName ? `Hi ${firstName}!` : 'Hello there!'}>
        Edit the texts and pictures of each page. A page keeps the mock-up texts until it is changed here.
      </CmsHeader>

      {error && (
        <Alert tone="error" title="Couldn’t load the pages">
          {error}
        </Alert>
      )}

      <ul className="cms-stats">
        <li className="cms-stat cms-stat--pink">
          <span className="cms-stat__value">{pages ? pages.filter((p) => p.updatedAt).length : '–'}</span>
          <span className="cms-stat__label">of {pages?.length ?? '–'} pages edited</span>
        </li>
        <li className="cms-stat cms-stat--yellow">
          <span className="cms-stat__value">{messages ? unread : '–'}</span>
          <span className="cms-stat__label">unread message{unread === 1 ? '' : 's'}</span>
          <TextLink href="/cms/messages" standalone className="cms-stat__link">
            Messages
          </TextLink>
        </li>
        <li className="cms-stat cms-stat--aqua">
          <span className="cms-stat__value">{images ? images.length : '–'}</span>
          <span className="cms-stat__label">uploaded image{images?.length === 1 ? '' : 's'}</span>
          <TextLink href="/cms/media" standalone className="cms-stat__link">
            Images
          </TextLink>
        </li>
      </ul>

      {!pages && !error && <Loader />}
      {pages && (
        <section className="cms-block">
          <h2 className="caps cms-block__title">Pages</h2>
          <ul className="cms-cards">
            {pages.map((page) => (
              <li key={page.key} className={`cms-card cms-card--${pageColor(page.key)}`}>
                <div className="cms-card__head">
                  <h3 className="display cms-card__title">{page.name}</h3>
                  {page.updatedAt ? <Tag color="aqua" small>Edited</Tag> : <Tag color="yellow" small>Mock-up texts</Tag>}
                </div>
                {page.path ? <p className="text-s cms-card__path">{page.path}</p> : <p className="text-s">{page.description}</p>}
                <p className="cms-card__sections">{page.sections.join(' · ')}</p>
                <p className="text-s cms-card__date">
                  {page.updatedAt ? `Updated ${formatDate(page.updatedAt)}${page.updatedBy ? ` by ${page.updatedBy}` : ''}` : 'Not edited yet'}
                </p>
                <div className="actions cms-card__actions">
                  <Link to={`/cms/pages/${page.key}`} className="btn btn--primary btn--small">
                    <span className="btn__surface">Edit</span>
                  </Link>
                  {page.path && (
                    <a href={page.path} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--small">
                      <span className="btn__surface">View</span>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
