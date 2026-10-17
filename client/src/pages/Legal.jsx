import { PageContent } from '../components/PublicLayout.jsx';
import { Paragraphs, SectionSignature, TextLink } from '../components/ui.jsx';

// Legal notice: publisher, hosting and free sections (intellectual property, personal data…).
// Not drawn in the mock-up, built with the UI kit. Texts: CMS › Legal notice.

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// Labelled lines of a card; empty values aren't shown
function Details({ rows }) {
  const filled = rows.filter(([, value]) => value);
  if (!filled.length) return null;
  return (
    <dl className="legal-card__details">
      {filled.map(([label, value]) => (
        <div key={label} className="legal-card__row">
          <dt className="caps">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Legal() {
  return (
    <PageContent pageKey="legal">
      {({ intro, publisher, host, terms }) => (
        <section className="band legal" aria-labelledby="legal-title">
          <div className="band__inner">
            <SectionSignature label={intro.label} note={intro.note} />
            <div className="legal__head">
              <h1 id="legal-title" className="display legal__title">
                {intro.title}
              </h1>
              <Paragraphs text={intro.text} className="lead" />
              {intro.updated && <p className="text-s">Last updated: {intro.updated}</p>}
            </div>

            <div className="legal__cards">
              <article className="legal-card legal-card--pink">
                <h2 className="display legal-card__title">{publisher.title}</h2>
                <Details
                  rows={[
                    ['Name', publisher.name],
                    ['Status', publisher.status],
                    ['Address', publisher.address && <Paragraphs text={publisher.address} className="text" />],
                    [
                      'Email',
                      publisher.email &&
                        (isEmail(publisher.email) ? (
                          <TextLink href={`mailto:${publisher.email}`} prose className="legal-card__link">
                            {publisher.email}
                          </TextLink>
                        ) : (
                          publisher.email
                        )),
                    ],
                    ['Phone', publisher.phone],
                    ['Publication director', publisher.director],
                  ]}
                />
              </article>
              <article className="legal-card legal-card--aqua">
                <h2 className="display legal-card__title">{host.title}</h2>
                <Details
                  rows={[
                    ['Host', host.name],
                    ['Address', host.address && <Paragraphs text={host.address} className="text" />],
                    [
                      'Website',
                      host.website && (
                        <TextLink href={host.website} prose className="legal-card__link">
                          {host.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </TextLink>
                      ),
                    ],
                  ]}
                />
              </article>
            </div>

            {terms.blocks.length > 0 && (
              <div className="legal__blocks">
                {terms.blocks.map((block, i) => (
                  <article key={`${block.title}${i}`} className="legal-block">
                    {block.title && <h2 className="display legal-block__title">{block.title}</h2>}
                    <Paragraphs text={block.text} className="text" />
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </PageContent>
  );
}
