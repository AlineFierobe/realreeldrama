import { Link as RouterLink } from 'react-router-dom';
import arrowRight from '../assets/icons/arrow-right.svg';
import brandAccents from '../assets/icons/brand-accents.svg';
import check from '../assets/icons/check.svg';
import checkLight from '../assets/icons/check-light.svg';
import instagram from '../assets/icons/instagram.svg';
import youtube from '../assets/icons/youtube.svg';
import tiktok from '../assets/icons/tiktok.svg';
import linkedin from '../assets/icons/linkedin.svg';

// Components of the mock-up's UI kit (Blog / Button, Link, Tag) and small shared helpers

// Text typed in the CMS: an empty line separates two paragraphs, a line break stays a line break
export function Paragraphs({ text, className = 'text' }) {
  const paragraphs = (text ?? '').split(/\n\s*\n/).filter((p) => p.trim());
  if (!paragraphs.length) return null;
  if (paragraphs.length === 1) return <p className={className}>{<Lines text={paragraphs[0]} />}</p>;
  return (
    <div className="paragraphs">
      {paragraphs.map((p, i) => (
        <p key={i} className={className}>
          <Lines text={p} />
        </p>
      ))}
    </div>
  );
}

// Multi-line heading: each line of the CMS text becomes a line of the heading
export function Lines({ text }) {
  return (text ?? '').split('\n').flatMap((line, i) => (i ? [<br key={i} />, line] : [line]));
}

export const isExternal = (href = '') => /^(https?:|mailto:)/i.test(href);

// Link typed in the CMS: site page (React Router), anchor, or external address (new tab)
export function SmartLink({ href, children, ...props }) {
  if (/^https?:/i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  if (/^mailto:/i.test(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}

// Button-link of the kit: kind primary | outline | text; size regular | small.
// Without an address: Disabled state of the kit.
export function Button({ href, kind = 'primary', size, children, className = '' }) {
  if (!children) return null;
  const classes = ['btn', `btn--${kind}`, size === 'small' && 'btn--small', className].filter(Boolean).join(' ');
  const surface = <span className="btn__surface">{children}</span>;
  if (!href) {
    return (
      <span className={`${classes} is-disabled`} aria-disabled="true" title="Coming soon">
        {surface}
      </span>
    );
  }
  return (
    <SmartLink href={href} className={classes}>
      {surface}
    </SmartLink>
  );
}

// Link of the kit: inline (underlined) or standalone (arrow).
// Without an address, the label stays visible but isn't clickable.
export function TextLink({ href, children, standalone, prose, className = '' }) {
  if (!children) return null;
  const classes = ['link', standalone && 'link--standalone', prose && 'link--prose', className].filter(Boolean).join(' ');
  const content = (
    <>
      {children}
      {standalone && <span className="link__arrow" style={{ '--arrow': `url("${arrowRight}")` }} aria-hidden="true" />}
    </>
  );
  if (!href) {
    return (
      <span className={`${classes} is-pending`} title="Link coming soon">
        {content}
      </span>
    );
  }
  return (
    <SmartLink href={href} className={classes}>
      {content}
    </SmartLink>
  );
}

// Category tag of the kit (pink, blush, peach, yellow, aqua, slate)
export function Tag({ color = 'pink', selected, small, children }) {
  if (!children) return null;
  return (
    <span className={`tag tag--${color}${selected ? ' is-selected' : ''}${small ? ' tag--small' : ''}`}>
      {selected && <img src={color === 'slate' ? checkLight : check} width="14" height="14" alt="" />}
      {children}
    </span>
  );
}

// Brand signature: the three accents + "VERTICALS & ALL THE FEELINGS"
export function Signature({ children }) {
  return (
    <span className="signature">
      <img src={brandAccents} width="32" height="8" alt="" />
      <span className="caps signature__text">{children}</span>
    </span>
  );
}

// Section header: uppercase label on the left, handwritten note on the right
export function SectionSignature({ label, note }) {
  if (!label && !note) return null;
  return (
    <div className="section-signature">
      {label && <p className="caps">{label}</p>}
      {note && <p className="script section-signature__note">{note}</p>}
    </div>
  );
}

const NETWORK_ICONS = {
  instagram: { src: instagram, width: 40, height: 40 },
  youtube: { src: youtube, width: 40, height: 40 },
  tiktok: { src: tiktok, width: 36, height: 40 },
  linkedin: { src: linkedin, width: 40, height: 40 },
};

export function SocialIcon({ network }) {
  const icon = NETWORK_ICONS[network];
  if (!icon) return null;
  return <img src={icon.src} width={icon.width} height={icon.height} alt="" />;
}

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader" role="status" aria-label={label}>
      <span />
      <span />
      <span />
    </div>
  );
}

export function Alert({ tone, title, children }) {
  return (
    <div className={`alert${tone ? ` alert--${tone}` : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <div>
        {title && <p className="alert__title">{title}</p>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
