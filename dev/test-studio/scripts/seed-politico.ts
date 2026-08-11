import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'

import {createClient, type Action, type IdentifiedSanityDocumentStub} from '@sanity/client'

/**
 * Seeds the POLITICO Content Variants demo: base content (sponsor, article,
 * home page), variant definitions with real match conditions, and the
 * variant-scoped document patches that make each condition demonstrable.
 * Mirrors the pattern in scripts/seed-coffee-shop-variants.ts — see
 * packages/sanity/src/core/variants/ACTIONS.md for the actions this uses.
 *
 * Runs against ttfgug5v/production (this account's own fully-writable
 * project) rather than the coffee shop demo's ppsg7ml5/coffee-shop — this
 * account has no write grant there at all. The tradeoff: Content Variants
 * closed-beta isn't enabled on ttfgug5v (variant definition count capped at
 * 0), so the base-content seed below succeeds but seedVariants() will fail
 * gracefully until that's turned on. See RESUME-HERE-politico-demo.md.
 */

function readDemoToken(): string {
  const envPath = fileURLToPath(new URL('../.env', import.meta.url))
  const contents = readFileSync(envPath, 'utf8')
  const match = contents.match(/^SANITY_DEMO_TOKEN=(.+)$/m)
  if (!match) throw new Error(`SANITY_DEMO_TOKEN not found in ${envPath}`)
  return match[1].trim()
}

const client = createClient({
  projectId: 'ttfgug5v',
  dataset: 'production',
  apiVersion: 'X',
  useCdn: false,
  token: process.env.SANITY_POLITICO_TOKEN ?? readDemoToken(),
})

interface VariantDefinitionCreateAction {
  actionType: 'sanity.action.variant.definition.create'
  variantId: string
  conditions?: Record<string, string>
  metadata?: {title?: string}
}

interface VariantDocumentCreateAction {
  actionType: 'sanity.action.document.variant.create'
  publishedId: string
  variantId: string
  baseId: string
}

// internationalizedArray plugin v5 value shape — see ../schema/politico/index.ts
function i18nString(values: Record<string, string>) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: 'internationalizedArrayStringValue',
    language,
    value,
  }))
}

function i18nText(values: Record<string, string>) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: 'internationalizedArrayTextValue',
    language,
    value,
  }))
}

const SPONSOR_ID = 'politico-sponsor-techforward'
const ARTICLE_ID = 'politico-article-ai-act'
const HOME_ID = 'politico-home'

const sponsor = {
  _id: SPONSOR_ID,
  _type: 'politicoSponsor',
  name: 'TechForward Alliance',
  headline: i18nString({
    en: 'How three EU compliance teams got AI Act–ready in 90 days',
  }),
  body: i18nString({
    en: 'A new whitepaper from TechForward Alliance walks through the compliance playbook — from documentation audits to model risk classification — that helped three enterprise AI teams clear their first regulatory review.',
  }),
  ctaLabel: i18nString({en: 'Read the whitepaper'}),
}

const BODY_BASELINE = [
  'BRUSSELS — The European Commission on Thursday signed off on the long-awaited technical standards that give national regulators the tools to actually enforce the AI Act, more than two years after the landmark law entered into force.',
  "The rules spell out how the bloc's 27 national AI supervisory authorities should assess whether a company's risk-management systems, training data documentation and human-oversight protocols meet the law's requirements for so-called high-risk AI systems — everything from hiring algorithms to medical-diagnosis tools.",
  "Fines for the most serious violations can reach 7 percent of a company's global annual revenue, among the steepest penalties in any EU digital rulebook, exceeding even the levies available under the bloc's competition law.",
  'Commission officials said the first enforcement actions are unlikely before early next year, giving companies a final window to bring their systems into compliance.',
].join('\n\n')

const article = {
  _id: ARTICLE_ID,
  _type: 'politicoArticle',
  title: 'AI Act enforcement rules (baseline / UK-EU edition)',
  slug: {_type: 'slug', current: 'eu-ai-act-enforcement-rules'},
  section: 'Europe',
  byline: 'By Marta Council, POLITICO Europe',
  publishedAt: '2026-08-06T09:00:00Z',
  kicker: i18nString({
    en: 'EU TECH POLICY',
    fr: "POLITIQUE TECHNOLOGIQUE DE L'UE",
    es: 'POLÍTICA TECNOLÓGICA DE LA UE',
  }),
  headline: i18nString({
    en: 'EU regulators finalize AI Act enforcement rules, clearing the way for first fines',
    fr: "Les régulateurs de l'UE finalisent les règles d'application de la loi sur l'IA, ouvrant la voie aux premières amendes",
    es: 'Los reguladores de la UE finalizan las normas de aplicación de la Ley de IA, allanando el camino para las primeras multas',
  }),
  dek: i18nString({
    en: 'The European Commission signed off Thursday on the technical standards that let national regulators levy penalties of up to 7 percent of global revenue.',
    fr: "La Commission européenne a validé jeudi les normes techniques permettant aux régulateurs nationaux d'infliger des amendes pouvant atteindre 7 % du chiffre d'affaires mondial.",
    es: 'La Comisión Europea aprobó el jueves las normas técnicas que permiten a los reguladores nacionales imponer multas de hasta el 7 % de la facturación mundial.',
  }),
  body: i18nText({en: BODY_BASELINE}),
  // contextBox and sponsoredInsert deliberately absent on baseline.
  memberAnalysis: {
    heading: i18nString({en: 'Pro Analysis: What Brussels enforcement actually looks like'}),
    teaser: i18nString({
      en: 'POLITICO Pro subscribers get the full breakdown of which sectors regulators are targeting first, and how compliance timelines compare across the 27 member states.',
    }),
    // body deliberately absent on baseline — the Pro variant unlocks it.
  },
}

const homePage = {
  _id: HOME_ID,
  _type: 'politicoHomePage',
  title: 'POLITICO — Content Variants Demo',
  featuredArticles: [{_type: 'reference', _key: 'a1', _ref: ARTICLE_ID}],
}

interface VariantDefinitionSpec {
  variantId: string
  conditions: Record<string, string>
  title: string
}

// Every definition ships with real match conditions from the start — a gap
// flagged and fixed retroactively on the coffee shop demo's first pass.
const DEFINITIONS: VariantDefinitionSpec[] = [
  {variantId: 'pol-pernl-us', conditions: {audience: 'us'}, title: 'Audience: US reader'},
  {variantId: 'pol-pernl-es', conditions: {audience: 'es'}, title: 'Audience: Spain reader'},
  {
    variantId: 'pol-pernl-pro',
    conditions: {subscriber_tier: 'pro'},
    title: 'Subscriber tier: Pro',
  },
  {
    variantId: 'pol-exprm-headline-b',
    conditions: {experiment: 'headline-test', treatment: 'b'},
    title: 'A/B test: Headline treatment B',
  },
  {
    variantId: 'pol-exprm-headline-c',
    conditions: {experiment: 'headline-test', treatment: 'c'},
    title: 'A/B test: Headline treatment C',
  },
  {
    variantId: 'pol-exprm-sponsor-on',
    conditions: {experiment: 'sponsor-insert', treatment: 'on'},
    title: 'A/B test: Sponsored insert on',
  },
]

interface DocPatchSpec {
  publishedId: string
  variantId: string
  patch: Record<string, unknown>
}

const DOC_PATCHES: DocPatchSpec[] = [
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-pernl-us',
    patch: {
      contextBox: {
        heading: i18nString({en: 'What it means in Washington'}),
        body: i18nText({
          en: [
            'For American technology companies operating in Europe, the enforcement rules matter well beyond Brussels. Firms including OpenAI, Google and Microsoft already maintain EU-specific compliance teams, and the new standards give those teams a concrete checklist for the first time — rather than the general risk-based principles the AI Act laid out in 2024.',
            'There is no equivalent U.S. federal framework. Congress has considered several AI oversight bills, but none has passed, leaving American regulators without comparable enforcement tools even as European penalties take effect.',
          ].join('\n\n'),
        }),
      },
    },
  },
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-pernl-es',
    patch: {
      dek: i18nString({
        en: "Spain's data protection authority says it will be among the first regulators to open enforcement cases, as Madrid pushes to position itself at the center of Europe's AI oversight push.",
      }),
      body: i18nText({
        en: [
          ...BODY_BASELINE.split('\n\n'),
          "In Madrid, the Spanish data protection agency (AEPD) said it is preparing to be among the first authorities in the bloc to bring an enforcement case, hoping to cement Spain's early lead in shaping how the AI Act is applied in practice.",
        ].join('\n\n'),
      }),
    },
  },
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-pernl-pro',
    patch: {
      'memberAnalysis.body': i18nText({
        en: [
          'Pro subscribers: national regulators are prioritizing three sectors for first enforcement — recruitment and HR AI tools, credit-scoring systems, and medical diagnostic software — according to three officials involved in early compliance reviews.',
          "Germany's BfDI and France's CNIL have already begun preliminary audits of financial-sector AI systems, while Ireland's Data Protection Commission — home to most Big Tech EU headquarters — is expected to lead on the platform side.",
          'Compliance timelines vary sharply by member state: Germany and France expect audits within 90 days of a complaint, while several smaller member states have not yet staffed dedicated AI enforcement units.',
        ].join('\n\n'),
      }),
    },
  },
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-exprm-headline-b',
    patch: {
      headline: i18nString({
        en: 'Brussels just handed regulators the power to fine AI companies 7% of revenue',
      }),
    },
  },
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-exprm-headline-c',
    patch: {
      headline: i18nString({
        en: 'Your AI vendor could be fined millions under new EU rules taking effect this year',
      }),
    },
  },
  {
    publishedId: ARTICLE_ID,
    variantId: 'pol-exprm-sponsor-on',
    patch: {
      sponsoredInsert: {_type: 'reference', _ref: SPONSOR_ID},
    },
  },
]

async function findVariantScopedDocId(publishedId: string, variantId: string): Promise<string> {
  const variantRef = `_.variants.${variantId}`
  const id = await client.fetch<string | null>(
    `*[_system.group._ref == $publishedId && _system.variant._ref == $variantRef][0]._id`,
    {publishedId, variantRef},
    {perspective: 'raw'},
  )
  if (!id) throw new Error(`Could not locate variant-scoped doc for ${publishedId} / ${variantId}`)
  return id
}

async function seedBaseContent(): Promise<void> {
  const documents: IdentifiedSanityDocumentStub[] = [sponsor, article, homePage]
  let transaction = client.transaction()
  for (const doc of documents) {
    transaction = transaction.createIfNotExists(doc)
  }
  await transaction.commit({visibility: 'sync'})
  console.log('base content seeded')
}

async function seedVariants(): Promise<void> {
  let hardFailure: Error | undefined
  for (const def of DEFINITIONS) {
    try {
      await client.action({
        actionType: 'sanity.action.variant.definition.create',
        variantId: def.variantId,
        conditions: def.conditions,
        metadata: {title: def.title},
      } satisfies VariantDefinitionCreateAction as unknown as Action)
      console.log(`definition created: ${def.variantId}`)
    } catch (err) {
      const message = (err as Error).message
      if (message.includes('already exists')) {
        console.log(`definition skipped (already exists): ${def.variantId}`)
      } else {
        hardFailure = err as Error
        console.log(`definition FAILED: ${def.variantId} — ${message}`)
      }
    }
  }

  if (hardFailure) {
    console.log(
      '\nContent Variants closed beta is not enabled on this project — base content is seeded, ' +
        'but variant definitions/documents cannot be created here yet. See ' +
        'RESUME-HERE-politico-demo.md for the two-track fix (role bump on ppsg7ml5, or ' +
        'entitlement grant on this project). Skipping the rest of variant seeding.',
    )
    return
  }

  const scopedDocIds = new Map<string, string>()

  for (const {publishedId, variantId} of DOC_PATCHES) {
    const key = `${publishedId}::${variantId}`
    if (scopedDocIds.has(key)) continue
    try {
      await client.action({
        actionType: 'sanity.action.document.variant.create',
        publishedId,
        variantId,
        baseId: publishedId,
      } satisfies VariantDocumentCreateAction as unknown as Action)
      console.log(`variant doc created: ${key}`)
    } catch (err) {
      console.log(`variant doc create skipped (likely exists): ${key} — ${(err as Error).message}`)
    }
    const scopedId = await findVariantScopedDocId(publishedId, variantId)
    scopedDocIds.set(key, scopedId)
  }

  for (const {publishedId, variantId, patch} of DOC_PATCHES) {
    const key = `${publishedId}::${variantId}`
    const scopedId = scopedDocIds.get(key)
    if (!scopedId) throw new Error(`missing scoped id for ${key}`)
    await client.patch(scopedId).set(patch).commit({visibility: 'sync'})
    console.log(`patched: ${key}`)
  }
}

async function run() {
  await seedBaseContent()
  await seedVariants()
  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
