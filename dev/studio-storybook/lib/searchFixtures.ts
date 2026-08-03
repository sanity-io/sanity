import {type SanityDocumentLike} from './mockContentLake'

/**
 * The fixture world the search stories search.
 *
 * It is deliberately small but type-varied: the filter engine derives its available filters from
 * the schema, so a schema of three string fields would produce a filter menu that cannot
 * demonstrate half the operators that exist. Every field family the filter system supports has at
 * least one field here - string, text, number, boolean, date, datetime, slug, reference, image,
 * file, array, and portable text - so the add-filter flow and every operator input has something
 * real to point at.
 */
export const searchSchemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', type: 'string', title: 'Title'},
      {name: 'subtitle', type: 'string', title: 'Subtitle'},
      {name: 'summary', type: 'text', title: 'Summary'},
      /**
       * A string field with `options.list`. The filter engine treats this as a different filter
       * (`stringList`, with equality operators and a Select input) rather than free-text matching,
       * so without at least one such field in the schema the `SearchFilterStringListInput` stories
       * have literally nothing to offer and render an empty menu.
       */
      {
        name: 'status',
        type: 'string',
        title: 'Editorial status',
        options: {
          list: [
            {title: 'Draft', value: 'draft'},
            {title: 'In review', value: 'in-review'},
            {title: 'Ready to publish', value: 'ready'},
            {title: 'Published', value: 'published'},
            {title: 'Archived', value: 'archived'},
          ],
        },
      },
      {name: 'slug', type: 'slug', title: 'Slug'},
      {name: 'featured', type: 'boolean', title: 'Featured'},
      {name: 'readingTime', type: 'number', title: 'Reading time (minutes)'},
      {name: 'publishedAt', type: 'datetime', title: 'Published at'},
      {name: 'reviewDate', type: 'date', title: 'Review date'},
      {name: 'author', type: 'reference', title: 'Author', to: [{type: 'author'}]},
      {name: 'coverImage', type: 'image', title: 'Cover image'},
      {name: 'attachment', type: 'file', title: 'Attachment'},
      {name: 'tags', type: 'array', title: 'Tags', of: [{type: 'string'}]},
      {name: 'body', type: 'array', title: 'Body', of: [{type: 'block'}]},
    ],
  },
  {
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
      {name: 'name', type: 'string', title: 'Name'},
      {name: 'role', type: 'string', title: 'Role'},
      {name: 'joinedAt', type: 'date', title: 'Joined at'},
      {name: 'active', type: 'boolean', title: 'Active'},
      {name: 'avatar', type: 'image', title: 'Avatar'},
    ],
  },
  {
    name: 'page',
    title: 'Page',
    type: 'document',
    fields: [
      {name: 'title', type: 'string', title: 'Title'},
      {name: 'path', type: 'slug', title: 'Path'},
      {name: 'published', type: 'boolean', title: 'Published'},
      /**
       * A nested object field, deliberately: every other filterable field in this schema sits
       * directly on its document, which gives `titlePath` a length of exactly one everywhere. The
       * filter engine (`fields.ts`) recurses into object fields and grows `titlePath` one segment
       * per level, and `FilterDetails` only renders its breadcrumb when that path has more than one
       * segment - without a nested field here, that branch has nothing real to point at.
       */
      {
        name: 'seo',
        type: 'object',
        title: 'SEO',
        fields: [{name: 'metaTitle', type: 'string', title: 'Meta title'}],
      },
    ],
  },
]

const iso = (daysAgo: number) => new Date(Date.UTC(2026, 6, 25 - daysAgo, 9, 30)).toISOString()
const day = (daysAgo: number) => iso(daysAgo).slice(0, 10)

/**
 * Every fixture carries `_createdAt` / `_updatedAt`. Without them the date orderings sort a column
 * of nulls and the ordering stories look like they work while proving nothing.
 */
const stamps = (createdDaysAgo: number, updatedDaysAgo = createdDaysAgo) => ({
  _createdAt: iso(createdDaysAgo),
  _updatedAt: iso(updatedDaysAgo),
})

const block = (text: string) => ({
  _type: 'block',
  _key: `b-${text.slice(0, 6).replace(/\W/g, '')}`,
  style: 'normal',
  children: [{_type: 'span', _key: 's1', text, marks: []}],
})

/**
 * Fixture documents. Titles are chosen so that ordinary queries ("release", "pricing", "guide")
 * each return a different, non-trivial subset - a fixture set where every query matches
 * everything, or nothing, cannot show ranking or filtering doing any work.
 *
 * `drafts.article-migration` has no published counterpart, so the results list has a genuine
 * draft-only row; `drafts.article-pricing` shadows its published version, which is what exercises
 * the draft overlay in the mock lake.
 */
export const searchFixtureDocuments: SanityDocumentLike[] = [
  {
    _id: 'author-ada',
    ...stamps(920, 900),
    _type: 'author',
    name: 'Ada Okafor',
    role: 'Staff writer',
    joinedAt: day(900),
    active: true,
  },
  {
    _id: 'author-bo',
    ...stamps(320, 300),
    _type: 'author',
    name: 'Bo Lindqvist',
    role: 'Editor',
    joinedAt: day(300),
    active: true,
  },
  {
    _id: 'author-mira',
    ...stamps(45, 40),
    _type: 'author',
    name: 'Mira Haddad',
    role: 'Contributor',
    joinedAt: day(40),
    active: false,
  },
  {
    _id: 'article-launch',
    status: 'published',
    ...stamps(5, 3),
    _type: 'article',
    title: 'Announcing the summer release',
    subtitle: 'Everything shipping this quarter',
    summary: 'A walkthrough of the release, what changed, and why.',
    slug: {_type: 'slug', current: 'announcing-the-summer-release'},
    featured: true,
    readingTime: 8,
    publishedAt: iso(3),
    reviewDate: day(1),
    author: {_type: 'reference', _ref: 'author-ada'},
    tags: ['release', 'product'],
    body: [block('The summer release lands today after a long run of preview builds.')],
  },
  {
    _id: 'article-pricing',
    status: 'published',
    ...stamps(60, 45),
    _type: 'article',
    title: 'How our pricing works',
    subtitle: 'Plans, limits, and overages',
    summary: 'A plain explanation of the pricing model.',
    slug: {_type: 'slug', current: 'how-our-pricing-works'},
    featured: false,
    readingTime: 12,
    publishedAt: iso(45),
    reviewDate: day(10),
    author: {_type: 'reference', _ref: 'author-bo'},
    tags: ['pricing'],
    body: [block('Pricing is per seat, with usage-based overages above the included quota.')],
  },
  {
    _id: 'drafts.article-pricing',
    status: 'in-review',
    ...stamps(60, 1),
    _type: 'article',
    title: 'How our pricing works (2027 update)',
    subtitle: 'Plans, limits, and overages',
    summary: 'A plain explanation of the pricing model, revised for the new tiers.',
    slug: {_type: 'slug', current: 'how-our-pricing-works'},
    featured: false,
    readingTime: 14,
    publishedAt: iso(45),
    reviewDate: day(2),
    author: {_type: 'reference', _ref: 'author-bo'},
    tags: ['pricing', 'draft'],
    body: [block('Pricing is per seat. The 2027 tiers change the included quota.')],
  },
  {
    _id: 'drafts.article-migration',
    status: 'draft',
    ...stamps(2, 0),
    _type: 'article',
    title: 'Migration guide: moving from v4',
    subtitle: 'Step by step',
    summary: 'What breaks, what does not, and the order to do it in.',
    slug: {_type: 'slug', current: 'migration-guide-v4'},
    featured: false,
    readingTime: 25,
    publishedAt: iso(1),
    reviewDate: day(0),
    author: {_type: 'reference', _ref: 'author-ada'},
    tags: ['guide', 'migration'],
    body: [block('Start by upgrading the schema, then the plugins, then the front end.')],
  },
  {
    _id: 'article-styleguide',
    status: 'ready',
    ...stamps(220, 200),
    _type: 'article',
    title: 'The editorial style guide',
    subtitle: 'House voice and conventions',
    summary: 'How we write headings, captions, and error messages.',
    slug: {_type: 'slug', current: 'editorial-style-guide'},
    featured: true,
    readingTime: 6,
    publishedAt: iso(200),
    reviewDate: day(90),
    author: {_type: 'reference', _ref: 'author-mira'},
    tags: ['guide', 'writing'],
    body: [block('Write to a practitioner. Do not explain their craft back to them.')],
  },
  {
    _id: 'article-archived',
    status: 'archived',
    ...stamps(520, 500),
    _type: 'article',
    title: 'Deprecated: the old release process',
    subtitle: 'Kept for reference',
    summary: 'Superseded by the summer release process.',
    slug: {_type: 'slug', current: 'old-release-process'},
    featured: false,
    readingTime: 4,
    publishedAt: iso(500),
    reviewDate: day(400),
    author: {_type: 'reference', _ref: 'author-bo'},
    tags: ['release', 'archive'],
    body: [block('This process was replaced. See the summer release note.')],
  },
  {
    _id: 'page-home',
    ...stamps(700, 650),
    _type: 'page',
    title: 'Home',
    path: {_type: 'slug', current: '/'},
    published: true,
  },
  {
    _id: 'page-pricing',
    ...stamps(400, 90),
    _type: 'page',
    title: 'Pricing',
    path: {_type: 'slug', current: '/pricing'},
    published: true,
  },
  {
    _id: 'page-releases',
    ...stamps(120, 4),
    _type: 'page',
    title: 'Release notes',
    path: {_type: 'slug', current: '/releases'},
    published: false,
  },
]
