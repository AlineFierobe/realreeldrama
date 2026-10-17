import { useCallback, useEffect, useState } from 'react';
import { useBlocker, useParams } from 'react-router-dom';
import { cmsPagesApi } from '../../lib/api.js';
import { Alert, Loader } from '../../components/ui.jsx';
import { Fields, hasInvalidUrl } from './Fields.jsx';
import { CmsHeader } from './CmsHeader.jsx';
import { formatDate } from './format.js';
import { pageColor } from './pageLinks.js';

// Editor of a page: one block per section of the mock-up, plus SEO.
// The form is built from the definition sent by the server.
export default function PageEditor() {
  const { key } = useParams();
  const [page, setPage] = useState(null); // { definition, defaults, updatedAt, updatedBy }
  const [content, setContent] = useState(null);
  const [seo, setSeo] = useState({ title: '', description: '' });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, title, text }
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPage(null);
    setError('');
    setNotice(null);
    cmsPagesApi
      .get(key)
      .then((data) => {
        if (cancelled) return;
        setPage(data);
        setContent(data.content);
        setSeo(data.seo);
        setDirty(false);
        document.title = `${data.definition.name} · Real Reel Drama CMS`;
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Unsaved changes: confirmation before leaving the page
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('You have unsaved changes. Leave this page anyway?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const updateSection = useCallback((sectionKey, value) => {
    setContent((prev) => ({ ...prev, [sectionKey]: value }));
    setDirty(true);
    setNotice(null);
  }, []);

  const updateSeo = (field, value) => {
    setSeo((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
    setNotice(null);
  };

  const restoreSection = (section) => {
    if (!window.confirm(`Replace “${section.label}” with the mock-up texts? Your changes in this section will be lost once you save.`)) return;
    updateSection(section.key, structuredClone(page.defaults[section.key]));
  };

  const invalid = page && content && page.definition.sections.some((s) => hasInvalidUrl(s.fields, content[s.key]));

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const saved = await cmsPagesApi.save(key, { content, seo });
      setContent(saved.content);
      setSeo(saved.seo);
      setPage((p) => ({ ...p, updatedAt: saved.updatedAt, updatedBy: saved.updatedBy }));
      setDirty(false);
      setNotice({ tone: 'success', title: 'Saved', text: 'The page is updated on the website.' });
    } catch (err) {
      setNotice({ tone: 'error', title: 'Not saved', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <Alert tone="error" title="Couldn’t load this page">
        {error}
      </Alert>
    );
  }
  if (!page || !content) return <Loader />;
  const { definition } = page;
  const color = pageColor(definition.key);
  const saveButton = (
    <button type="button" className="btn btn--primary" onClick={save} disabled={!dirty || saving || invalid}>
      <span className="btn__surface">{saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}</span>
    </button>
  );

  return (
    <div className="cms-page">
      <CmsHeader
        overline={definition.path ? `PAGE · ${definition.path}` : 'SETTINGS'}
        title={definition.name}
        note={page.updatedAt ? null : 'Mock-up texts'}
        actions={
          <>
            {definition.path && (
              <a href={definition.path} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
                <span className="btn__surface">View page ↗</span>
              </a>
            )}
            {saveButton}
          </>
        }
      >
        {definition.description && <p>{definition.description}</p>}
        <p className="text-s">{page.updatedAt ? `Last saved ${formatDate(page.updatedAt)}${page.updatedBy ? ` by ${page.updatedBy}` : ''}.` : 'Not edited yet: the website shows the texts of the mock-up.'}</p>
      </CmsHeader>

      {/* Quick links to the sections */}
      <nav className="cms-jump" aria-label="Sections">
        {definition.sections.map((s) => (
          <a key={s.key} href={`#section-${s.key}`} className={`tag tag--small tag--${color}`}>
            {s.label}
          </a>
        ))}
        {definition.path && (
          <a href="#section-seo" className="tag tag--small tag--slate">
            SEO
          </a>
        )}
      </nav>

      {notice && (
        <Alert tone={notice.tone} title={notice.title}>
          {notice.text}
        </Alert>
      )}
      {invalid && (
        <Alert tone="error" title="Check the links">
          One or more links are not valid. Fix them to save.
        </Alert>
      )}

      {definition.sections.map((section, i) => (
        <details key={section.key} id={`section-${section.key}`} className={`cms-section cms-section--${color}`} open>
          <summary className="cms-section__head">
            <span className="cms-section__number">{String(i + 1).padStart(2, '0')}</span>
            <span className="display cms-section__title">{section.label}</span>
            <button
              type="button"
              className="btn btn--text btn--small cms-section__restore"
              onClick={(e) => {
                e.preventDefault();
                restoreSection(section);
              }}
            >
              <span className="btn__surface">Restore mock-up texts</span>
            </button>
          </summary>
          <div className="cms-section__body">
            {section.description && <p className="cms-section__desc">{section.description}</p>}
            <Fields fields={section.fields} value={content[section.key]} onChange={(v) => updateSection(section.key, v)} />
          </div>
        </details>
      ))}

      {definition.path && (
        <details id="section-seo" className="cms-section cms-section--slate">
          <summary className="cms-section__head">
            <span className="cms-section__number">SEO</span>
            <span className="display cms-section__title">Search engines & sharing</span>
          </summary>
          <div className="cms-section__body">
            <div className="cms-fields">
              <div className="field field--wide">
                <label className="field__label" htmlFor="seo-title">
                  Meta title
                </label>
                <input id="seo-title" className="input" maxLength={70} value={seo.title} placeholder={definition.seo?.title} onChange={(e) => updateSeo('title', e.target.value)} />
                <p className="field__help">{seo.title.length}/70 · Leave empty to use the default shown in grey.</p>
              </div>
              <div className="field field--wide">
                <label className="field__label" htmlFor="seo-description">
                  Meta description
                </label>
                <textarea id="seo-description" className="textarea" rows={3} maxLength={200} value={seo.description} placeholder={definition.seo?.description} onChange={(e) => updateSeo('description', e.target.value)} />
                <p className="field__help">{seo.description.length}/200 · Leave empty to use the default shown in grey.</p>
              </div>
            </div>
            {/* Google result preview */}
            <div className="cms-serp" aria-label="Search result preview">
              <span className="cms-serp__url">realreeldrama.com{definition.path === '/' ? '' : definition.path}</span>
              <span className="cms-serp__title">{seo.title || definition.seo?.title}</span>
              <span className="cms-serp__desc">{seo.description || definition.seo?.description}</span>
            </div>
          </div>
        </details>
      )}

      {/* Save bar, always visible while there are unsaved changes */}
      {dirty && (
        <div className="cms-savebar" role="status">
          <span className="script cms-savebar__note">Unsaved changes…</span>
          {saveButton}
        </div>
      )}
    </div>
  );
}
