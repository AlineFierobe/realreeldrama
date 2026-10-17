// Editable content of the site: one entry per page (plus "site" for the shared settings).
// Each page is split into sections, each section into fields. The CMS builds its
// forms from these definitions, and the server uses them to validate what it receives.
// The "default" values are the texts of the Figma mock-up: they are shown
// as long as the page hasn't been edited in the CMS.
//
// Field types:
//   text      one line (headings, labels); a "\n" typed as a line break is kept in multi-line headings
//   textarea  several lines; an empty line separates two paragraphs
//   url       link: full address (https://…), mailto:, site path (/about) or anchor (#unscripted)
//   image     picture: a mock-up photo (/images/…) or an image uploaded in the CMS (/api/media/…)
//   select    one value among "options"
//   list      list of repeatable items, each with its own fields ("fields")

const text = (key, label, value = '', help) => ({ key, label, type: 'text', default: value, help });
const area = (key, label, value = '', help) => ({ key, label, type: 'textarea', default: value, help });
const url = (key, label, value = '', help) => ({ key, label, type: 'url', default: value, help });
const image = (key, label, value = '', help) => ({ key, label, type: 'image', default: value, help });
const select = (key, label, options, value, help) => ({ key, label, type: 'select', options, default: value ?? options[0].value, help });
const list = (key, label, itemLabel, fields, value = [], help) => ({ key, label, type: 'list', itemLabel, fields, default: value, help });

// Category tag colors of the UI kit (Blog / Tag)
export const TAG_COLORS = [
  { value: 'pink', label: 'Pink' },
  { value: 'blush', label: 'Blush' },
  { value: 'peach', label: 'Peach' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'aqua', label: 'Aqua' },
  { value: 'slate', label: 'Slate' },
];

const NETWORKS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'other', label: 'Other (no icon)' },
];

// Fields shared by several sections
const sectionLabel = (value) => text('label', 'Section label', value, 'Small uppercase label at the top of the section.');
const handNote = (value) => text('note', 'Handwritten note', value, 'Short handwritten line, shown in the brand’s script font.');
const tag = (value, color) => [text('tag', 'Category tag', value), select('tagColor', 'Tag color', TAG_COLORS, color)];
const alt = (value) => text('imageAlt', 'Image description (alt text)', value, 'Describes the picture for screen readers and search engines.');
const lineBreakHelp = 'Press Enter to start a new line, as in the mock-up.';
// No link yet: the label is still shown, but not clickable (the mock-up doesn't give the addresses)
const linkHelp = 'Leave empty while the address isn’t known: the label stays visible but isn’t clickable.';

export const PAGES = [
  {
    key: 'site',
    name: 'Site settings',
    description: 'Brand, footer and social media links, shown on every page (and in the homepage “Social medias” section).',
    sections: [
      {
        key: 'identity',
        label: 'Brand',
        fields: [
          text('siteName', 'Site name', 'REAL REEL DRAMA'),
          text('signature', 'Signature', 'Verticals & all the feelings', 'Shown in small capitals under the site name.'),
        ],
      },
      {
        key: 'footer',
        label: 'Footer',
        fields: [
          text('closing', 'Handwritten line', 'The credits roll. The conversation continues.'),
          text('text', 'Text', 'Reviews, discoveries and a soft spot for a good plot twist.'),
          text('socialTitle', 'Social links title', 'Let’s keep talking'),
          text('copyright', 'Copyright', 'REAL REEL DRAMA', 'The © sign and the current year are added automatically.'),
          text('colophon', 'Closing words', 'A little cinema. A lot of feeling.'),
        ],
      },
      {
        key: 'social',
        label: 'Social media',
        fields: [
          list(
            'links',
            'Social links',
            'Social link',
            [select('network', 'Network', NETWORKS), text('label', 'Label'), url('url', 'Link', '', linkHelp)],
            [
              { network: 'instagram', label: 'Instagram', url: '' },
              { network: 'youtube', label: 'YouTube', url: '' },
              { network: 'tiktok', label: 'TikTok', url: '' },
              { network: 'linkedin', label: 'LinkedIn', url: '' },
            ]
          ),
        ],
      },
    ],
  },
  {
    key: 'home',
    path: '/',
    name: 'Homepage',
    seo: {
      title: 'Real Reel Drama · Verticals & all the feelings',
      description: 'Your way into vertical drama culture—from audience-focused reviews to the people behind the screen. By Meagan Johnson.',
    },
    sections: [
      {
        key: 'hero',
        label: 'Hero · Meet Meagan',
        fields: [
          ...tag('Founder & host', 'yellow'),
          text('greeting', 'Handwritten greeting', 'Hi, I’m Meagan Johnson.'),
          area('title', 'Headline', 'The mind behind\nReal Reel Drama.', lineBreakHelp),
          area('intro', 'Introduction', 'Your way into vertical drama culture—from audience-focused reviews to the people behind the screen.'),
          text('primaryLabel', 'Main button label', 'Meet Meagan'),
          url('primaryUrl', 'Main button link', '/about'),
          text('secondaryLabel', 'Second button label', 'Explore Unscripted'),
          url('secondaryUrl', 'Second button link', '#unscripted'),
          image('image', 'Portrait', '/images/meagan-hero.jpg'),
          alt('Meagan Johnson laughing'),
          text('caption', 'Handwritten caption', 'Small screen. Big feelings.'),
        ],
      },
      {
        key: 'unscripted',
        label: 'Real Reel Unscripted',
        fields: [
          sectionLabel('REAL REEL UNSCRIPTED'),
          handNote('Let’s ditch the script.'),
          image('coverImage', 'Show artwork', '/images/unscripted-cover.jpg'),
          text('coverAlt', 'Show artwork description', 'Real Reel Unscripted, behind the screen, beyond the chaos, hosted by Meagan Johnson'),
          image('hostImage', 'Host card picture', '/images/unscripted-host.jpg'),
          text('hostAlt', 'Host card description', 'Meagan Johnson on the Real Reel Unscripted poster'),
          text('annotation', 'Handwritten annotation', 'Behind the vertical screen'),
          area('title', 'Show title', 'REAL REEL\nUNSCRIPTED', lineBreakHelp),
          text('tagline', 'Tagline', 'No scripts. No rules. No drama. Just vertical culture unleashed'),
          area(
            'description',
            'Description',
            'Step behind the vertical screen for a chaotic, unscripted dive into the wildest corner of streaming entertainment. Host Meagan Johnson sits down with the stars and creators of your favorite micro-dramas—from sweeping billionaire romances to high-seas adventures—to trade behind-the-scenes confessions and tackle ridiculous improv. This isn’t a talk show; it’s a hilarious, heartfelt look at what happens when the industry’s biggest icons completely ditch the script.'
          ),
          text('buttonLabel', 'Button label', 'Explore Unscripted'),
          url('buttonUrl', 'Button link', '', 'Where to watch the show. Without a link, the button is shown as disabled.'),
        ],
      },
      {
        key: 'reviews',
        label: 'Reviews',
        fields: [
          ...tag('Audience lens', 'pink'),
          text('title', 'Title', 'REVIEWS'),
          text('tagline', 'Tagline', 'Recommendations, commentary, and audience-focused reviews.'),
          text('followText', 'Invitation', 'Follow Real Reel Drama on Instagram & Vertibase'),
          list('links', 'Links', 'Link', [text('label', 'Label'), url('url', 'Link', '', linkHelp)], [
            { label: 'Instagram', url: '' },
            { label: 'Vertibase', url: '' },
          ]),
          text('note', 'Handwritten note', 'For the viewers. For the feelings.'),
        ],
      },
      {
        key: 'industry',
        label: 'Industry',
        fields: [
          ...tag('Industry lens', 'yellow'),
          text('title', 'Title', 'INDUSTRY'),
          text('tagline', 'Tagline', 'Panels, events, festivals, and industry participation.'),
          list('links', 'Links', 'Link', [text('label', 'Label'), url('url', 'Link', '', linkHelp)], [{ label: 'Explore podcasts', url: '' }]),
          text('note', 'Handwritten note', 'Beyond the screen.'),
        ],
      },
      {
        key: 'about',
        label: 'About Meagan',
        fields: [
          sectionLabel('ABOUT'),
          handNote('A face behind the feelings.'),
          image('image', 'Photo', '/images/meagan-headshot.jpg'),
          alt('Portrait of Meagan Johnson'),
          text('caption', 'Photo caption', 'MEAGAN JOHNSON / FOUNDER & HOST'),
          area('title', 'Handwritten heading', 'Curiosity, commentary,\nand a whole lot of heart.', lineBreakHelp),
          area(
            'text',
            'Biography',
            'Meagan Johnson, founder of RealReelDrama, is a leading voice in the vertical drama space—blending cultural insight, sharp commentary, and industry curiosity.'
          ),
          text('primaryLabel', 'Main button label', 'About Meagan'),
          url('primaryUrl', 'Main button link', '/about'),
          text('secondaryLabel', 'Second button label', 'Contact'),
          url('secondaryUrl', 'Second button link', '/contact'),
        ],
      },
      {
        key: 'social',
        label: 'Social medias',
        description: 'The links themselves are edited in Site settings › Social media.',
        fields: [text('title', 'Title', 'SOCIAL MEDIAS'), handNote('The conversation doesn’t stop here.')],
      },
    ],
  },
  {
    key: 'about',
    path: '/about',
    name: 'About',
    seo: {
      title: 'About Meagan Johnson · Real Reel Drama',
      description: 'Meagan Johnson, founder of RealReelDrama, is a leading voice in the vertical drama space—blending cultural insight, sharp commentary, and industry curiosity.',
    },
    sections: [
      {
        key: 'intro',
        label: 'Introduction',
        fields: [
          ...tag('Founder & host', 'yellow'),
          text('greeting', 'Handwritten greeting', 'A face behind the feelings.'),
          area('title', 'Headline', 'Meet\nMeagan Johnson.', lineBreakHelp),
          area(
            'text',
            'Introduction',
            'Meagan Johnson, founder of RealReelDrama, is a leading voice in the vertical drama space—blending cultural insight, sharp commentary, and industry curiosity.'
          ),
          image('image', 'Photo', '/images/meagan-headshot.jpg'),
          alt('Portrait of Meagan Johnson'),
          text('caption', 'Photo caption', 'MEAGAN JOHNSON / FOUNDER & HOST'),
        ],
      },
      {
        key: 'story',
        label: 'Story',
        fields: [
          sectionLabel('THE STORY'),
          handNote('Small screen. Big feelings.'),
          area('title', 'Handwritten heading', 'Curiosity, commentary,\nand a whole lot of heart.', lineBreakHelp),
          area(
            'text',
            'Text',
            'Real Reel Drama is your way into vertical drama culture—from audience-focused reviews to the people behind the screen.\n\nThrough reviews, industry conversations and Real Reel Unscripted, Meagan celebrates the stories, the creators and the feelings that make micro-dramas impossible to stop watching.'
          ),
        ],
      },
      {
        key: 'lenses',
        label: 'What you’ll find here',
        fields: [
          sectionLabel('WHAT YOU’LL FIND HERE'),
          handNote('Three ways in.'),
          list(
            'cards',
            'Cards',
            'Card',
            [...tag('', 'pink'), text('title', 'Title'), area('text', 'Text'), text('linkLabel', 'Link label'), url('linkUrl', 'Link')],
            [
              { tag: 'Audience lens', tagColor: 'pink', title: 'REVIEWS', text: 'Recommendations, commentary, and audience-focused reviews.', linkLabel: 'Read the reviews', linkUrl: '/#reviews' },
              { tag: 'Industry lens', tagColor: 'yellow', title: 'INDUSTRY', text: 'Panels, events, festivals, and industry participation.', linkLabel: 'Beyond the screen', linkUrl: '/#industry' },
              { tag: 'The show', tagColor: 'aqua', title: 'UNSCRIPTED', text: 'No scripts. No rules. No drama. Just vertical culture unleashed.', linkLabel: 'Explore Unscripted', linkUrl: '/#unscripted' },
            ]
          ),
        ],
      },
      {
        key: 'cta',
        label: 'Call to action',
        fields: [
          text('title', 'Title', 'LET’S TALK'),
          handNote('The conversation doesn’t stop here.'),
          area('text', 'Text', 'Questions, collaborations, panels or a vertical drama to recommend? Meagan would love to hear from you.'),
          text('buttonLabel', 'Button label', 'Contact Meagan'),
          url('buttonUrl', 'Button link', '/contact'),
        ],
      },
    ],
  },
  {
    key: 'contact',
    path: '/contact',
    name: 'Contact',
    seo: {
      title: 'Contact · Real Reel Drama',
      description: 'Questions, collaborations, panels or a vertical drama to recommend? Send a message to Meagan Johnson.',
    },
    sections: [
      {
        key: 'intro',
        label: 'Introduction',
        fields: [
          sectionLabel('CONTACT'),
          handNote('Let’s keep talking.'),
          area('title', 'Headline', 'Say hello.', lineBreakHelp),
          area('text', 'Text', 'Questions, collaborations, panels or a vertical drama to recommend? Send a message and Meagan will get back to you.'),
        ],
      },
      {
        key: 'form',
        label: 'Contact form',
        fields: [
          text('title', 'Heading', 'Write a message'),
          text('nameLabel', 'Name field label', 'Your name'),
          text('emailLabel', 'Email field label', 'Your email'),
          text('topicLabel', 'Topic field label', 'Topic'),
          list('topics', 'Topics', 'Topic', [text('label', 'Topic')], [
            { label: 'General question' },
            { label: 'Collaboration' },
            { label: 'Panels & events' },
            { label: 'Real Reel Unscripted' },
            { label: 'A drama to recommend' },
          ]),
          text('messageLabel', 'Message field label', 'Your message'),
          text('submitLabel', 'Button label', 'Send message'),
          area('success', 'Confirmation message', 'Thank you! Your message is on its way. Meagan will get back to you as soon as possible.'),
          text('note', 'Small print', 'Your details are only used to answer your message.'),
        ],
      },
      {
        key: 'aside',
        label: 'Social media box',
        description: 'The links come from Site settings › Social media.',
        fields: [text('title', 'Title', 'Prefer socials?'), area('text', 'Text', 'Follow Real Reel Drama for reviews, discoveries and behind-the-scenes moments.')],
      },
    ],
  },
];

export const PAGE_KEYS = PAGES.map((p) => p.key);
export const findPage = (key) => PAGES.find((p) => p.key === key);
