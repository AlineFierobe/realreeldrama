import { useEffect, useRef, useState } from 'react';
import { cmsMediaApi, MAX_IMAGE_MB } from '../../lib/api.js';
import { Alert, Loader, Tag } from '../../components/ui.jsx';
import { CmsHeader } from './CmsHeader.jsx';
import { formatDate, formatSize } from './format.js';

// Image library: pictures uploaded from the CMS (they are chosen in the page editors)
export default function Media() {
  const inputRef = useRef(null);
  const [images, setImages] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Images · Real Reel Drama CMS';
    cmsMediaApi.list().then(setImages).catch((err) => setError(err.message));
  }, []);

  const upload = async (files) => {
    setError('');
    setBusy(true);
    try {
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error(`${file.name}: choose a JPEG, PNG, WebP or GIF image.`);
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) throw new Error(`${file.name} is too large (${MAX_IMAGE_MB} MB maximum).`);
        const media = await cmsMediaApi.upload(file);
        setImages((list) => [media, ...(list ?? [])]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = async (media) => {
    if (!window.confirm(`Delete “${media.filename}”? This can’t be undone.`)) return;
    try {
      await cmsMediaApi.remove(media._id);
      setImages((list) => list.filter((m) => m._id !== media._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="cms-page">
      <CmsHeader
        overline="LIBRARY"
        title="Images"
        note="Say cheese!"
        actions={
          <button type="button" className="btn btn--primary" onClick={() => inputRef.current?.click()} disabled={busy}>
            <span className="btn__surface">{busy ? 'Uploading…' : '+ Upload images'}</span>
          </button>
        }
      >
        Photos uploaded here can be chosen in every page editor. JPEG, PNG, WebP or GIF, {MAX_IMAGE_MB} MB max. An image still used on a page can’t be deleted.
      </CmsHeader>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => upload([...e.target.files])} />
      {error && (
        <Alert tone="error" title="Something went wrong">
          {error}
        </Alert>
      )}
      {!images && !error && <Loader />}
      {images && (
        <div
          className="cms-dropzone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload([...e.dataTransfer.files]);
          }}
        >
          {images.length === 0 ? (
            <div className="cms-empty">
              <p className="script">No images yet.</p>
              <p className="text-s">Drop pictures here or use “Upload images”. The mock-up photos stay available in the page editors.</p>
            </div>
          ) : (
            <ul className="cms-gallery">
              {images.map((m) => (
                <li key={m._id} className="cms-gallery__item">
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="cms-gallery__thumb">
                    <img src={m.url} alt={m.filename} loading="lazy" />
                  </a>
                  <div className="cms-gallery__info">
                    <strong title={m.filename}>{m.filename}</strong>
                    <span className="text-s">
                      {formatSize(m.size)} · {formatDate(m.createdAt)}
                    </span>
                    <span className="cms-gallery__usage">
                      {m.usedIn.length ? m.usedIn.map((p) => <Tag key={p} color="aqua" small>{p}</Tag>) : <Tag color="yellow" small>Not used</Tag>}
                    </span>
                  </div>
                  <button type="button" className="btn btn--danger btn--small" onClick={() => remove(m)} disabled={m.usedIn.length > 0} title={m.usedIn.length ? 'Used on a page' : 'Delete'}>
                    <span className="btn__surface">Delete</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
