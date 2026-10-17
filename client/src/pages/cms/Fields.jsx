import { useEffect, useId, useRef, useState } from 'react';
import { cmsMediaApi, MAX_IMAGE_MB } from '../../lib/api.js';
import { Loader, Tag } from '../../components/ui.jsx';

// CMS fields, built from the definitions of server/src/data/pages.js
// (text, textarea, url, image, select, list). Lists can contain other lists.

// Same rules as the server (utils/content.js)
export function isAllowedUrl(value) {
  if (value === '') return true;
  if (/^(\/(?!\/)|#)/.test(value)) return true;
  return /^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/i.test(value.trim());
}

// Photos of the mock-up, shipped with the site (client/public/images)
const MOCKUP_IMAGES = [
  { url: '/images/meagan-hero.jpg', filename: 'Meagan · hero portrait' },
  { url: '/images/meagan-headshot.jpg', filename: 'Meagan · headshot' },
  { url: '/images/unscripted-cover.jpg', filename: 'Unscripted · show artwork' },
  { url: '/images/unscripted-host.jpg', filename: 'Unscripted · host card' },
];

// Empty value of a list item (for "Add")
export function emptyItem(fields) {
  return Object.fromEntries(fields.map((f) => [f.key, f.type === 'list' ? [] : f.type === 'select' ? f.default ?? f.options[0].value : '']));
}

// Text summarizing a collapsed list item: first filled text field
const summary = (fields, item) => {
  const first = fields.find((f) => (f.type === 'text' || f.type === 'textarea') && item[f.key]?.trim());
  return first ? item[first.key].split('\n')[0] : '';
};

function ListField({ field, value, onChange, depth }) {
  const [open, setOpen] = useState(() => new Set());
  const items = value ?? [];

  const update = (index, item) => onChange(items.map((it, i) => (i === index ? item : it)));
  const remove = (index) => {
    const label = summary(field.fields, items[index]) || `${field.itemLabel} ${index + 1}`;
    if (window.confirm(`Remove “${label}”?`)) onChange(items.filter((_, i) => i !== index));
  };
  const move = (index, delta) => {
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };
  const toggle = (index) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  const add = () => {
    onChange([...items, emptyItem(field.fields)]);
    setOpen((prev) => new Set(prev).add(items.length));
  };

  return (
    <fieldset className={`cms-list cms-list--depth-${depth} field--wide`}>
      <legend className="field__label">
        {field.label} <span className="cms-count">{items.length}</span>
      </legend>
      {field.help && <p className="field__help">{field.help}</p>}
      {items.length === 0 && <p className="text-s">No {field.itemLabel.toLowerCase()} yet.</p>}
      <ol className="cms-list__items">
        {items.map((item, index) => {
          const isOpen = open.has(index);
          return (
            <li key={index} className={`cms-item${isOpen ? ' is-open' : ''}`}>
              <div className="cms-item__head">
                <button type="button" className="cms-item__toggle" aria-expanded={isOpen} onClick={() => toggle(index)}>
                  <span className="cms-item__index">{index + 1}</span>
                  <span className="cms-item__summary">
                    <strong>{field.itemLabel}</strong> {summary(field.fields, item) && <>· {summary(field.fields, item)}</>}
                  </span>
                  <span className="cms-item__chevron" aria-hidden="true" />
                </button>
                <div className="cms-item__tools">
                  <button type="button" className="cms-icon-btn" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up" title="Move up">
                    ↑
                  </button>
                  <button type="button" className="cms-icon-btn" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move down" title="Move down">
                    ↓
                  </button>
                  <button type="button" className="cms-icon-btn cms-icon-btn--danger" onClick={() => remove(index)} aria-label="Remove" title="Remove">
                    ×
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="cms-item__body">
                  <Fields fields={field.fields} value={item} onChange={(next) => update(index, next)} depth={depth + 1} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="btn btn--outline btn--small" onClick={add}>
        <span className="btn__surface">+ Add {field.itemLabel.toLowerCase()}</span>
      </button>
    </fieldset>
  );
}

// Image library, shared by all the image fields of the screen
let libraryCache = null;

function ImageField({ field, value, onChange, id }) {
  const inputRef = useRef(null);
  const [picking, setPicking] = useState(false);
  const [library, setLibrary] = useState(libraryCache);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!picking || library) return;
    cmsMediaApi
      .list()
      .then((list) => {
        libraryCache = list;
        setLibrary(list);
      })
      .catch((err) => setError(err.message));
  }, [picking, library]);

  const upload = async (file) => {
    if (!file) return;
    setError('');
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) return setError('Choose a JPEG, PNG, WebP or GIF image.');
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) return setError(`This image is too large (${MAX_IMAGE_MB} MB maximum).`);
    setBusy(true);
    try {
      const media = await cmsMediaApi.upload(file);
      libraryCache = [media, ...(libraryCache ?? [])];
      setLibrary(libraryCache);
      onChange(media.url);
      setPicking(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const choices = [...(library ?? []).map((m) => ({ url: m.url, filename: m.filename })), ...MOCKUP_IMAGES];

  return (
    <div className="field field--wide cms-image">
      <span className="field__label" id={`${id}-label`}>
        {field.label}
      </span>
      <div className="cms-image__row">
        <div
          className={`cms-image__preview${busy ? ' is-busy' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            upload(e.dataTransfer.files?.[0]);
          }}
        >
          {value ? <img src={value} alt="" /> : <span className="text-s">No image</span>}
          {busy && <Loader label="Uploading…" />}
        </div>
        <div className="cms-image__tools">
          <p className="text-s">Drop an image on the preview, or:</p>
          <div className="actions">
            <button type="button" className="btn btn--primary btn--small" onClick={() => inputRef.current?.click()} disabled={busy}>
              <span className="btn__surface">{busy ? 'Uploading…' : 'Upload'}</span>
            </button>
            <button type="button" className="btn btn--outline btn--small" aria-expanded={picking} onClick={() => setPicking((p) => !p)}>
              <span className="btn__surface">{picking ? 'Close library' : 'Library'}</span>
            </button>
            {field.default && value !== field.default && (
              <button type="button" className="btn btn--text btn--small" onClick={() => onChange(field.default)}>
                <span className="btn__surface">Mock-up image</span>
              </button>
            )}
          </div>
          <p className="field__help">JPEG, PNG, WebP or GIF · {MAX_IMAGE_MB} MB max.</p>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden aria-labelledby={`${id}-label`} onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p className="field__error">{error}</p>}
      {picking && (
        <div className="cms-library" role="listbox" aria-label="Choose an image">
          {!library && !error && <Loader />}
          {choices.map((m) => (
            <button
              key={m.url}
              type="button"
              role="option"
              aria-selected={m.url === value}
              className={`cms-library__item${m.url === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(m.url);
                setPicking(false);
              }}
              title={m.filename}
            >
              <img src={m.url} alt="" loading="lazy" />
              <span>{m.filename}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tag colors: clickable swatches showing the kit's tags
function ColorField({ field, value, onChange, id }) {
  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>
        {field.label}
      </span>
      <div className="cms-swatches" role="radiogroup" aria-labelledby={`${id}-label`}>
        {field.options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className="cms-swatch" onClick={() => onChange(o.value)}>
            <Tag color={o.value} small selected={value === o.value}>
              {o.label}
            </Tag>
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ field, value, onChange, depth }) {
  const id = useId();
  if (field.type === 'list') return <ListField field={field} value={value} onChange={onChange} depth={depth} />;
  if (field.type === 'image') return <ImageField field={field} value={value} onChange={onChange} id={id} />;
  if (field.type === 'select' && field.key.endsWith('Color')) return <ColorField field={field} value={value} onChange={onChange} id={id} />;

  const invalid = field.type === 'url' && !isAllowedUrl(value ?? '');
  let control;
  if (field.type === 'textarea') {
    const rows = Math.min(14, Math.max(2, Math.ceil((value?.length ?? 0) / 90) + (value?.split('\n').length ?? 1) - 1));
    control = <textarea id={id} className="textarea" rows={rows} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  } else if (field.type === 'select') {
    control = (
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        id={id}
        className="input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.type === 'url' ? 'https://…  ·  /about  ·  #unscripted  ·  mailto:…' : undefined}
        aria-invalid={invalid}
        spellCheck={field.type !== 'url'}
      />
    );
  }
  return (
    <div className={`field${field.type === 'textarea' ? ' field--wide' : ''}`}>
      <label className="field__label" htmlFor={id}>
        {field.label}
      </label>
      {control}
      {invalid ? <p className="field__error">Enter a full link (https://…), an email (mailto:…), a page (/about) or an anchor (#unscripted).</p> : field.help && <p className="field__help">{field.help}</p>}
    </div>
  );
}

// Group of fields: value = { key: value }
export function Fields({ fields, value, onChange, depth = 0 }) {
  return (
    <div className="cms-fields">
      {fields.map((f) => (
        <Field key={f.key} field={f} depth={depth} value={value?.[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  );
}

// True if a link of the content is invalid (prevents saving)
export function hasInvalidUrl(fields, value) {
  return fields.some((f) => {
    if (f.type === 'url') return !isAllowedUrl(value?.[f.key] ?? '');
    if (f.type === 'list') return (value?.[f.key] ?? []).some((item) => hasInvalidUrl(f.fields, item));
    return false;
  });
}
