import { useEffect, useId, useRef, useState } from 'react';
import { cmsMediaApi, MAX_IMAGE_MB } from '../../lib/api.js';
import { framingStyle, Loader, Tag, toImage } from '../../components/ui.jsx';

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
  return Object.fromEntries(
    fields.map((f) => [f.key, f.type === 'list' ? [] : f.type === 'select' ? (f.default ?? f.options[0].value) : f.type === 'image' ? toImage('') : ''])
  );
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

const MAX_ZOOM = 3; // same limit as the server (utils/content.js)
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const round1 = (n) => Math.round(n * 10) / 10;

// Framing tool: the preview has the shape of the image's slot on the site (field.frame).
// Drag the picture to move it, zoom with the slider or the mouse wheel, arrows and +/- on the keyboard.
// The result is a focus point in % (x, y) and a zoom, applied on the site by FramedImage.
function Framing({ field, image, onChange, onDropFile, busy }) {
  const frameRef = useRef(null);
  const drag = useRef(null);
  const [natural, setNatural] = useState(null); // { w, h } of the loaded picture
  const frame = field.frame ?? { ratio: '4 / 3', radius: '16px' };

  useEffect(() => setNatural(null), [image.src]);

  const update = (patch) => onChange({ ...image, ...patch });

  // Distance (px) the picture can travel in the frame, on each axis, at the current zoom
  const travel = () => {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || !natural) return { w: 0, h: 0 };
    const scale = Math.max(box.width / natural.w, box.height / natural.h) * image.zoom;
    return { w: natural.w * scale - box.width, h: natural.h * scale - box.height };
  };

  const onPointerDown = (e) => {
    if (!image.src || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: image.x, y: image.y, travel: travel() };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    // Moving the picture right shows more of its left side: the focus point goes left
    const x = d.travel.w > 1 ? clamp(d.x - ((e.clientX - d.px) / d.travel.w) * 100, 0, 100) : d.x;
    const y = d.travel.h > 1 ? clamp(d.y - ((e.clientY - d.py) / d.travel.h) * 100, 0, 100) : d.y;
    update({ x: round1(x), y: round1(y) });
  };

  const endDrag = () => {
    drag.current = null;
  };

  const zoomTo = (zoom) => update({ zoom: round1(clamp(zoom, 1, MAX_ZOOM)) });

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      update({ x: clamp(image.x + dx, 0, 100), y: clamp(image.y + dy, 0, 100) });
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomTo(image.zoom + 0.1);
    } else if (e.key === '-') {
      e.preventDefault();
      zoomTo(image.zoom - 0.1);
    }
  };

  // Mouse wheel zoom (React's onWheel can't prevent the page from scrolling)
  useEffect(() => {
    const el = frameRef.current;
    if (!el || !image.src) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      onChange({ ...image, zoom: round1(clamp(image.zoom - e.deltaY * 0.002, 1, MAX_ZOOM)) });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [image, onChange]);

  const moved = image.x !== 50 || image.y !== 50 || image.zoom !== 1;

  return (
    <div className="cms-framing">
      <div
        ref={frameRef}
        className={`cms-framing__frame${busy ? ' is-busy' : ''}${image.src ? '' : ' is-empty'}`}
        style={{ aspectRatio: frame.ratio, borderRadius: frame.radius }}
        tabIndex={image.src ? 0 : -1}
        role={image.src ? 'application' : undefined}
        aria-label="Image framing: drag or use the arrow keys to move, + and − to zoom"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onDropFile(e.dataTransfer.files?.[0]);
        }}
      >
        {image.src ? (
          <img
            src={image.src}
            alt=""
            draggable="false"
            style={framingStyle(image)}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          />
        ) : (
          <span className="text-s">No image</span>
        )}
        {busy && <Loader label="Uploading…" />}
      </div>
      {image.src && (
        <div className="cms-framing__controls">
          <label className="cms-framing__zoom">
            <span className="text-s">Zoom</span>
            <input type="range" min="1" max={MAX_ZOOM} step="0.05" value={image.zoom} onChange={(e) => zoomTo(Number(e.target.value))} />
            <span className="text-s cms-framing__value">{Math.round(image.zoom * 100)}%</span>
          </label>
          <button type="button" className="btn btn--text btn--small" onClick={() => update({ x: 50, y: 50, zoom: 1 })} disabled={!moved}>
            <span className="btn__surface">Center</span>
          </button>
        </div>
      )}
    </div>
  );
}

const sameImage = (a, b) => a.src === b.src && a.x === b.x && a.y === b.y && a.zoom === b.zoom;

function ImageField({ field, value, onChange, id }) {
  const inputRef = useRef(null);
  const [picking, setPicking] = useState(false);
  const [library, setLibrary] = useState(libraryCache);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const image = toImage(value ?? '');
  const fallback = toImage(field.default ?? '');

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

  // A new picture starts centered, without zoom
  const choose = (src) => onChange({ src, x: 50, y: 50, zoom: 1 });

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
      choose(media.url);
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
        <Framing field={field} image={image} onChange={onChange} onDropFile={upload} busy={busy} />
        <div className="cms-image__tools">
          {image.src && <p className="text-s">Drag the picture to move it in its frame, zoom with the slider or the mouse wheel. The frame has the shape of the image on the site.</p>}
          <div className="actions">
            <button type="button" className="btn btn--primary btn--small" onClick={() => inputRef.current?.click()} disabled={busy}>
              <span className="btn__surface">{busy ? 'Uploading…' : 'Upload'}</span>
            </button>
            <button type="button" className="btn btn--outline btn--small" aria-expanded={picking} onClick={() => setPicking((p) => !p)}>
              <span className="btn__surface">{picking ? 'Close library' : 'Library'}</span>
            </button>
            {fallback.src && !sameImage(image, fallback) && (
              <button type="button" className="btn btn--text btn--small" onClick={() => onChange(fallback)}>
                <span className="btn__surface">Mock-up image</span>
              </button>
            )}
          </div>
          <p className="field__help">Drop a file on the frame or upload one: JPEG, PNG, WebP or GIF · {MAX_IMAGE_MB} MB max.</p>
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
              aria-selected={m.url === image.src}
              className={`cms-library__item${m.url === image.src ? ' is-selected' : ''}`}
              onClick={() => {
                choose(m.url);
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
