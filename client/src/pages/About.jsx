import sparkles from '../assets/icons/sparkles.svg';
import { PageContent } from '../components/PublicLayout.jsx';
import { Button, FramedImage, Lines, Paragraphs, SectionSignature, Tag, TextLink } from '../components/ui.jsx';

// About page: not drawn in the mock-up, built with the homepage's sections and the UI kit.
// Texts: CMS › About.
export default function About() {
  return (
    <PageContent pageKey="about">
      {({ intro, story, lenses, cta }) => (
        <>
          <section className="hero hero--about" aria-labelledby="about-title">
            <div className="hero__intro">
              <Tag color={intro.tagColor}>{intro.tag}</Tag>
              {intro.greeting && <p className="script hero__greeting">{intro.greeting}</p>}
              <h1 id="about-title" className="hero__title">
                <Lines text={intro.title} />
              </h1>
              <Paragraphs text={intro.text} className="lead" />
            </div>
            <figure className="about-teaser__figure hero__headshot">
              <FramedImage className="about-teaser__photo" image={intro.image} alt={intro.imageAlt} width="400" height="600" fetchpriority="high" />
              {intro.caption && <figcaption className="caps caps--light about-teaser__caption">{intro.caption}</figcaption>}
            </figure>
          </section>

          <section className="band band--pink story" aria-labelledby="story-title">
            <div className="band__inner">
              <SectionSignature label={story.label} note={story.note} />
              <div className="story__body">
                <h2 id="story-title" className="script story__title">
                  <Lines text={story.title} />
                  <img src={sparkles} width="28" height="28" alt="" />
                </h2>
                <Paragraphs text={story.text} className="about-teaser__text" />
              </div>
            </div>
          </section>

          {lenses.cards.length > 0 && (
            <section className="band" aria-labelledby="lenses-title">
              <div className="band__inner">
                <SectionSignature label={lenses.label} note={lenses.note} />
                <h2 id="lenses-title" className="visually-hidden">
                  {lenses.label}
                </h2>
                <ul className="cards">
                  {lenses.cards.map((card, i) => (
                    <li key={`${card.title}${i}`} className={`card card--${card.tagColor}`}>
                      <Tag color={card.tagColor}>{card.tag}</Tag>
                      <h3 className="display card__title">{card.title}</h3>
                      <Paragraphs text={card.text} className="card__text" />
                      <TextLink href={card.linkUrl} standalone className="card__link">
                        {card.linkLabel}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <section className="band band--aqua cta" aria-labelledby="cta-title">
            <div className="band__inner cta__inner">
              <h2 id="cta-title" className="display cta__title">
                {cta.title}
              </h2>
              {cta.note && <p className="script cta__note">{cta.note}</p>}
              <Paragraphs text={cta.text} className="lead cta__text" />
              <Button href={cta.buttonUrl}>{cta.buttonLabel}</Button>
            </div>
          </section>
        </>
      )}
    </PageContent>
  );
}
