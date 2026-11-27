import {BillIcon} from '@sanity/icons/Bill'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {HomeIcon} from '@sanity/icons/Home'
import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Schema types for the POLITICO Content Variants demo: a news-article content
 * model showing the same two V1 use cases as the coffee shop demo (see
 * ../coffeeShop) applied to publishing — personalization (regional/audience
 * framing, subscriber tier) and A/B testing (headline treatments, sponsored
 * content insertion). Field-level localization is included as a light touch,
 * explicitly framed as a future-direction extension rather than V1 scope —
 * see docs/spec-briefs and the POLITICO account brief: localization is a
 * named non-goal for the Variants V1 primitive.
 */

// Same plugin-resolution workaround as ../coffeeShop — hand-defining the text
// variant of internationalizedArray sidesteps a quirk where only the first
// workspace requesting `fieldTypes: ['text']` across this monorepo's
// `defineConfig([...])` actually gets it registered.
const internationalizedArrayTextValue = defineType({
  name: 'internationalizedArrayTextValue',
  title: 'Internationalized array text value',
  type: 'object',
  fields: [
    defineField({name: 'value', title: 'Value', type: 'text'}),
    defineField({
      name: 'language',
      type: 'string',
      hidden: true,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {select: {title: 'value', subtitle: 'language'}},
})

const internationalizedArrayText = defineType({
  name: 'internationalizedArrayText',
  title: 'Internationalized array text',
  type: 'array',
  of: [defineArrayMember({type: 'internationalizedArrayTextValue'})],
})

export const politicoSponsor = defineType({
  name: 'politicoSponsor',
  title: 'POLITICO Demo: Sponsor',
  type: 'document',
  icon: BillIcon,
  description:
    'A native-advertising sponsor referenced by an article’s sponsored insert. Give this document variant content to demo the same reference-resolves-per-variant pattern as the coffee shop promo.',
  fields: [
    defineField({
      name: 'name',
      title: 'Sponsor name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({name: 'headline', title: 'Headline', type: 'internationalizedArrayString'}),
    defineField({name: 'body', title: 'Body', type: 'internationalizedArrayString'}),
    defineField({name: 'ctaLabel', title: 'CTA label', type: 'internationalizedArrayString'}),
  ],
  preview: {select: {title: 'name', subtitle: 'headline.0.value'}},
})

export const politicoArticle = defineType({
  name: 'politicoArticle',
  title: 'POLITICO Demo: Article',
  type: 'document',
  icon: DocumentTextIcon,
  description:
    'A single story authored once (the UK/EU baseline edition) and resolved into different shapes at query time by variant: regional/audience framing (US adds context, Spain reframes), subscriber tier (Pro unlocks full analysis), and an A/B headline + sponsored-insert experiment — mirroring the exact examples POLITICO raised on the Jul 21 2026 tech check-in.',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      description: 'For the Studio document list only — not rendered on the storefront.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: {list: ['Congress', 'White House', 'Europe', 'Technology', 'Economy']},
    }),
    defineField({name: 'byline', title: 'Byline', type: 'string'}),
    defineField({name: 'publishedAt', title: 'Published at', type: 'datetime'}),
    defineField({
      name: 'kicker',
      title: 'Kicker',
      type: 'internationalizedArrayString',
      description:
        'Small eyebrow label above the headline, e.g. "EU TECH POLICY". Localized (en/fr/es) — future-direction, not V1.',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'internationalizedArrayString',
      description:
        'The A/B headline-test surface — 3 treatments of the same story (see the "A/B testing" variant group). Also localized (en/fr/es).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'dek',
      title: 'Dek (subheadline)',
      type: 'internationalizedArrayString',
      description: 'Localized (en/fr/es) — future-direction, not V1.',
    }),
    defineField({name: 'heroImage', title: 'Hero image', type: 'image'}),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'internationalizedArrayText',
      description:
        'Plain-text paragraphs (split on blank lines) — same tradeoff as the coffee demo’s product description.',
    }),
    defineField({
      name: 'contextBox',
      title: 'Added-context box',
      type: 'object',
      description:
        'Absent on the UK/EU baseline. The US-audience variant adds this box — the exact "UK story gets a US version with added context" example from the account brief.',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'internationalizedArrayString'}),
        defineField({name: 'body', title: 'Body', type: 'internationalizedArrayText'}),
      ],
      preview: {select: {title: 'heading.0.value'}},
    }),
    defineField({
      name: 'sponsoredInsert',
      title: 'Sponsored insert',
      type: 'reference',
      to: [{type: 'politicoSponsor'}],
      description:
        'Empty on the baseline. The "Sponsor content — on" A/B treatment sets this, inserting a native-ad block mid-article — POLITICO’s named "ad/sponsorship insertion" newsletter use case, applied to an article slot.',
    }),
    defineField({
      name: 'memberAnalysis',
      title: 'Pro member analysis',
      type: 'object',
      description:
        'The baseline (free) doc holds only a teaser — the "Pro subscriber" variant overrides this with the full analysis. Demonstrates subscriber-tier gating on the same story.',
      fields: [
        defineField({name: 'heading', title: 'Heading', type: 'internationalizedArrayString'}),
        defineField({name: 'body', title: 'Body', type: 'internationalizedArrayText'}),
        defineField({
          name: 'teaser',
          title: 'Teaser (shown to free readers)',
          type: 'internationalizedArrayString',
        }),
      ],
      preview: {select: {title: 'heading.0.value'}},
    }),
  ],
  preview: {
    select: {title: 'headline.0.value', subtitle: 'section', media: 'heroImage'},
    prepare({title, subtitle, media}) {
      return {title: title || 'Untitled article', subtitle, media}
    },
  },
})

export const politicoHomePage = defineType({
  name: 'politicoHomePage',
  title: 'POLITICO Demo: Home page',
  type: 'document',
  icon: HomeIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'featuredArticles',
      title: 'Featured articles',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'politicoArticle'}]})],
      description: 'Leave empty to show the latest articles automatically.',
    }),
  ],
  preview: {select: {title: 'title'}},
})

export const politicoSchemaTypes = [
  internationalizedArrayTextValue,
  internationalizedArrayText,
  politicoSponsor,
  politicoArticle,
  politicoHomePage,
]
