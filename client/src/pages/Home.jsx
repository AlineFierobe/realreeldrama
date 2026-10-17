import sparkles from '../assets/icons/sparkles.svg';
import messagesSquare from '../assets/icons/messages-square.svg';
import mic from '../assets/icons/mic.svg';
import { PageContent, useSite } from '../components/PublicLayout.jsx';
import { Button, FramedImage, Lines, Paragraphs, SectionSignature, SocialIcon, Tag, TextLink } from '../components/ui.jsx';

// Homepage (Figma frame "REAL REEL DRAMA · Homepage"): Meet Meagan, Real Reel Unscripted,
// Reviews & Industry, About, Social medias. Texts: CMS › Homepage.

function Hero({ hero }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__intro">
        <Tag color={hero.tagColor}>{hero.tag}</Tag>
        {hero.greeting && <p className="script hero__greeting">{hero.greeting}</p>}
        <h1 id="hero-title" className="hero__title">
          <Lines text={hero.title} />
        </h1>
        <Paragraphs text={hero.intro} className="lead" />
        <div className="actions hero__actions">
          <Button href={hero.primaryUrl}>{hero.primaryLabel}</Button>
          <Button href={hero.secondaryUrl} kind="outline">
            {hero.secondaryLabel}
          </Button>
        </div>
      </div>
      <figure className="hero__portrait">
        <FramedImage className="hero__photo" image={hero.image} alt={hero.imageAlt} width="500" height="889" fetchpriority="high" />
        {hero.caption && (
          <figcaption className="hero__caption">
            <span className="script">{hero.caption}</span>
            <img src={sparkles} width="28" height="28" alt="" />
          </figcaption>
        )}
      </figure>
    </section>
  );
}

function Unscripted({ show }) {
  return (
    <section id="unscripted" className="band band--aqua unscripted" aria-labelledby="unscripted-title">
      <div className="band__inner">
        <SectionSignature label={show.label} note={show.note} />
        <div className="unscripted__body">
          <div className="unscripted__artwork">
            <FramedImage className="unscripted__cover" image={show.coverImage} alt={show.coverAlt} width="430" height="430" loading="lazy" />
            {show.hostImage?.src && (
              <div className="unscripted__host">
                <FramedImage className="unscripted__host-photo" image={show.hostImage} alt={show.hostAlt} width="176" height="224" loading="lazy" />
              </div>
            )}
            {show.annotation && <p className="script unscripted__annotation">{show.annotation}</p>}
          </div>
          <div className="unscripted__copy">
            <h2 id="unscripted-title" className="display unscripted__title">
              <Lines text={show.title} />
            </h2>
            {show.tagline && <p className="unscripted__tagline">{show.tagline}</p>}
            <Paragraphs text={show.description} className="text" />
            <Button href={show.buttonUrl}>{show.buttonLabel}</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Reviews / Industry: two colored halves side by side
function Lens({ id, lens, color, icon }) {
  return (
    <section id={id} className={`lens lens--${color}`} aria-labelledby={`${id}-title`}>
      <div className="lens__identity">
        <Tag color={lens.tagColor}>{lens.tag}</Tag>
        <img src={icon} width="38" height="38" alt="" />
      </div>
      <h2 id={`${id}-title`} className="display lens__title">
        {lens.title}
      </h2>
      {lens.tagline && <p className="lens__tagline">{lens.tagline}</p>}
      {(lens.followText || lens.links.length > 0) && (
        <div className="lens__links">
          {lens.followText && <p className="lens__follow">{lens.followText}</p>}
          {lens.links.length > 0 && (
            <ul className="lens__link-list">
              {lens.links.map((link, i) => (
                <li key={`${link.label}${i}`}>
                  <TextLink href={link.url} standalone>
                    {link.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {lens.note && <p className="script lens__note">{lens.note}</p>}
    </section>
  );
}

function About({ about }) {
  return (
    <section id="about" className="band about-teaser" aria-labelledby="about-title">
      <div className="band__inner">
        <SectionSignature label={about.label} note={about.note} />
        <div className="about-teaser__body">
          <figure className="about-teaser__figure">
            <FramedImage className="about-teaser__photo" image={about.image} alt={about.imageAlt} width="400" height="600" loading="lazy" />
            {about.caption && <figcaption className="caps caps--light about-teaser__caption">{about.caption}</figcaption>}
          </figure>
          <div className="about-teaser__copy">
            <h2 id="about-title" className="script about-teaser__title">
              <Lines text={about.title} />
            </h2>
            <Paragraphs text={about.text} className="about-teaser__text" />
            <div className="actions">
              <Button href={about.primaryUrl}>{about.primaryLabel}</Button>
              <Button href={about.secondaryUrl} kind="outline">
                {about.secondaryLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Social media cards: the links come from CMS › Site settings › Social media
export function SocialCards({ title, note, headingLevel: H = 'h2' }) {
  const site = useSite();
  const links = site.social.links.filter((s) => s.label);
  if (!links.length) return null;
  return (
    <section className="band band--aqua social" aria-labelledby="social-title">
      <div className="band__inner social__inner">
        <div className="social__head">
          <H id="social-title" className="display social__title">
            {title}
          </H>
          {note && <p className="script social__note">{note}</p>}
        </div>
        <ul className="social__cards">
          {links.map((s, i) => (
            <li key={`${s.label}${i}`} className="social__card">
              <SocialIcon network={s.network} />
              <TextLink href={s.url} standalone>
                {s.label}
              </TextLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <PageContent pageKey="home">
      {(c) => (
        <>
          <Hero hero={c.hero} />
          <Unscripted show={c.unscripted} />
          <div className="lenses">
            <Lens id="reviews" lens={c.reviews} color="pink" icon={messagesSquare} />
            <Lens id="industry" lens={c.industry} color="yellow" icon={mic} />
          </div>
          <About about={c.about} />
          <SocialCards title={c.social.title} note={c.social.note} />
        </>
      )}
    </PageContent>
  );
}
