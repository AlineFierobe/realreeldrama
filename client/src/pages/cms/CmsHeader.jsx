// Header of each CMS screen: overline, title, handwritten note, description and actions
export function CmsHeader({ overline, title, note, actions, children }) {
  return (
    <header className="cms-header">
      <div className="cms-header__text">
        {overline && <p className="caps cms-header__overline">{overline}</p>}
        <div className="cms-header__title-row">
          <h1 className="display cms-header__title">{title}</h1>
          {note && <p className="script cms-header__note">{note}</p>}
        </div>
        {children && <div className="text cms-header__desc">{children}</div>}
      </div>
      {actions && <div className="actions cms-header__actions">{actions}</div>}
    </header>
  );
}
