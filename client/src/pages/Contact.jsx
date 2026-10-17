import { useEffect, useRef, useState } from 'react';
import { PageContent, useSite } from '../components/PublicLayout.jsx';
import { Alert, Lines, Paragraphs, SectionSignature, SocialIcon, TextLink } from '../components/ui.jsx';
import { messagesApi } from '../lib/api.js';

// Contact page: not drawn in the mock-up, built with the UI kit.
// Messages land in CMS › Messages. Texts: CMS › Contact.

function ContactForm({ form }) {
  const empty = { name: '', email: '', topic: form.topics[0]?.label ?? '', message: '', website: '' };
  const [values, setValues] = useState(empty);
  const [status, setStatus] = useState('idle'); // idle | sending | sent
  const [error, setError] = useState('');
  const sentRef = useRef(null);

  // Once sent, the (shorter) confirmation is brought into view
  useEffect(() => {
    if (status === 'sent') sentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [status]);

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await messagesApi.send(values);
      setStatus('sent');
      setValues(empty);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  };

  if (status === 'sent') {
    return (
      <div ref={sentRef} className="contact-form contact-form--sent">
        <Alert tone="success" title="Message sent">
          {form.success}
        </Alert>
        <button type="button" className="link-button" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      {form.title && <h2 className="display contact-form__title">{form.title}</h2>}
      <div className="contact-form__row">
        <div className="field">
          <label className="field__label" htmlFor="contact-name">
            {form.nameLabel}
          </label>
          <input id="contact-name" className="input" required maxLength={120} autoComplete="name" value={values.name} onChange={set('name')} />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="contact-email">
            {form.emailLabel}
          </label>
          <input id="contact-email" className="input" type="email" required maxLength={200} autoComplete="email" value={values.email} onChange={set('email')} />
        </div>
      </div>
      {form.topics.length > 0 && (
        <div className="field">
          <label className="field__label" htmlFor="contact-topic">
            {form.topicLabel}
          </label>
          <select id="contact-topic" className="select" value={values.topic} onChange={set('topic')}>
            {form.topics.map((t, i) => (
              <option key={`${t.label}${i}`}>{t.label}</option>
            ))}
          </select>
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor="contact-message">
          {form.messageLabel}
        </label>
        <textarea id="contact-message" className="textarea" rows={6} required maxLength={5000} value={values.message} onChange={set('message')} />
      </div>
      {/* Trap for bots: hidden from people, filled in by robots only */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} />
      </div>
      {error && (
        <Alert tone="error" title="Message not sent">
          {error}
        </Alert>
      )}
      <div className="contact-form__footer">
        <button type="submit" className="btn btn--primary" disabled={status === 'sending'}>
          <span className="btn__surface">{status === 'sending' ? 'Sending…' : form.submitLabel}</span>
        </button>
        {form.note && <p className="text-s">{form.note}</p>}
      </div>
    </form>
  );
}

function SocialBox({ aside }) {
  const site = useSite();
  const links = site.social.links.filter((s) => s.label);
  return (
    <aside className="contact-aside">
      {aside.title && <h2 className="script contact-aside__title">{aside.title}</h2>}
      <Paragraphs text={aside.text} className="text" />
      {links.length > 0 && (
        <ul className="contact-aside__links">
          {links.map((s, i) => (
            <li key={`${s.label}${i}`}>
              <span className="contact-aside__icon">
                <SocialIcon network={s.network} />
              </span>
              <TextLink href={s.url} standalone>
                {s.label}
              </TextLink>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

export default function Contact() {
  return (
    <PageContent pageKey="contact">
      {({ intro, form, aside }) => (
        <section className="band contact" aria-labelledby="contact-title">
          <div className="band__inner">
            <SectionSignature label={intro.label} note={intro.note} />
            <div className="contact__head">
              <h1 id="contact-title" className="hero__title">
                <Lines text={intro.title} />
              </h1>
              <Paragraphs text={intro.text} className="lead" />
            </div>
            <div className="contact__body">
              <ContactForm form={form} />
              <SocialBox aside={aside} />
            </div>
          </div>
        </section>
      )}
    </PageContent>
  );
}
