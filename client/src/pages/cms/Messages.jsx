import { useEffect, useState } from 'react';
import { cmsMessagesApi } from '../../lib/api.js';
import { Alert, Loader, Paragraphs, Tag } from '../../components/ui.jsx';
import { CmsHeader } from './CmsHeader.jsx';
import { formatDate } from './format.js';

// Messages received from the site's Contact page
export default function Messages() {
  const [messages, setMessages] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Messages · Real Reel Drama CMS';
    cmsMessagesApi.list().then(setMessages).catch((err) => setError(err.message));
  }, []);

  const replace = (msg) => setMessages((list) => list.map((m) => (m._id === msg._id ? msg : m)));

  const open = (msg) => {
    setOpenId(openId === msg._id ? null : msg._id);
    if (!msg.read) cmsMessagesApi.setRead(msg._id, true).then(replace).catch(() => {});
  };

  const toggleRead = (msg) => cmsMessagesApi.setRead(msg._id, !msg.read).then(replace).catch((err) => setError(err.message));

  const remove = async (msg) => {
    if (!window.confirm(`Delete the message from ${msg.name}? This can’t be undone.`)) return;
    try {
      await cmsMessagesApi.remove(msg._id);
      setMessages((list) => list.filter((m) => m._id !== msg._id));
    } catch (err) {
      setError(err.message);
    }
  };

  const unread = messages?.filter((m) => !m.read).length ?? 0;
  const shown = messages?.filter((m) => filter === 'all' || !m.read) ?? [];

  return (
    <div className="cms-page">
      <CmsHeader overline="CONTACT PAGE" title="Messages" note={unread ? `${unread} new!` : null}>
        {messages ? `${messages.length} message${messages.length === 1 ? '' : 's'} · ${unread} unread` : 'Messages sent from the Contact page.'}
      </CmsHeader>
      {error && (
        <Alert tone="error" title="Something went wrong">
          {error}
        </Alert>
      )}
      {!messages && !error && <Loader />}
      {messages?.length > 0 && (
        <div className="cms-filters" role="group" aria-label="Filter">
          {[
            ['all', 'All'],
            ['unread', 'Unread'],
          ].map(([value, label]) => (
            <button key={value} type="button" className="cms-swatch" aria-pressed={filter === value} onClick={() => setFilter(value)}>
              <Tag color={filter === value ? 'slate' : 'aqua'} small>
                {label}
              </Tag>
            </button>
          ))}
        </div>
      )}
      {messages?.length === 0 && (
        <div className="cms-empty">
          <p className="script">No messages yet.</p>
          <p className="text-s">They’ll show up here as soon as someone writes from the Contact page.</p>
        </div>
      )}
      {shown.length > 0 && (
        <ul className="cms-messages">
          {shown.map((msg) => (
            <li key={msg._id} className={`cms-message${msg.read ? '' : ' is-unread'}`}>
              <button type="button" className="cms-message__head" aria-expanded={openId === msg._id} onClick={() => open(msg)}>
                <span className="cms-message__from">
                  <strong>{msg.name}</strong> <span className="text-s">{msg.email}</span>
                </span>
                <span className="cms-message__meta">
                  {msg.topic && <Tag color="yellow" small>{msg.topic}</Tag>}
                  {!msg.read && <Tag color="pink" small>New</Tag>}
                  <span className="text-s">{formatDate(msg.createdAt)}</span>
                </span>
              </button>
              {openId === msg._id && (
                <div className="cms-message__body">
                  <Paragraphs text={msg.message} className="text" />
                  <div className="actions">
                    <a className="btn btn--primary btn--small" href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.topic || 'Real Reel Drama'}`)}`}>
                      <span className="btn__surface">Reply by email</span>
                    </a>
                    <button type="button" className="btn btn--outline btn--small" onClick={() => toggleRead(msg)}>
                      <span className="btn__surface">Mark as {msg.read ? 'unread' : 'read'}</span>
                    </button>
                    <button type="button" className="btn btn--danger btn--small" onClick={() => remove(msg)}>
                      <span className="btn__surface">Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
