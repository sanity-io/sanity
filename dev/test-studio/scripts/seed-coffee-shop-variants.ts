import {type Action} from '@sanity/client'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

// These experimental variant actions aren't in @sanity/client's public `Action` union yet
// (see packages/sanity/src/core/variants/ACTIONS.md for the authoritative shape).
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

interface VariantDefinitionSpec {
  variantId: string
  conditions?: Record<string, string>
  title: string
}

interface VariantDocPatchSpec {
  publishedId: string
  variantId: string
  patch: Record<string, unknown>
}

const DEFINITIONS: VariantDefinitionSpec[] = [
  {
    variantId: 'pernl-returning',
    conditions: {audience: 'returning'},
    title: 'Audience: Returning visitor',
  },
  {
    variantId: 'pernl-vip',
    conditions: {audience: 'vip'},
    title: 'Audience: VIP / loyalty member',
  },
  {
    variantId: 'pernl-local',
    conditions: {audience: 'local'},
    title: 'Audience: Local regular (pickup)',
  },
  {variantId: 'exprm-hero-treatment-b', title: 'A/B test: Hero treatment B'},
  {variantId: 'fflag-early-access', title: 'Feature flag: Early access beta banner'},
]

const PROMO_ID = 'demo-coffee-promo-main'
const HERO_PRODUCT_ID = 'demo-coffee-product-espresso'
const LANDING_ID = 'demo-coffee-landing'

const DOC_PATCHES: VariantDocPatchSpec[] = [
  {
    publishedId: PROMO_ID,
    variantId: 'pernl-returning',
    patch: {
      title: 'Welcome back!',
      tagline: 'Ready for your next bag? Subscribe and never run low.',
      ctaLabel: 'Reorder now',
    },
  },
  {
    publishedId: HERO_PRODUCT_ID,
    variantId: 'pernl-returning',
    patch: {discount: 10},
  },
  {
    publishedId: PROMO_ID,
    variantId: 'pernl-vip',
    patch: {
      title: "You're one of our best customers",
      tagline: 'Enjoy 20% off, always — our thanks for your loyalty.',
      ctaLabel: 'Shop your discount',
    },
  },
  {
    publishedId: HERO_PRODUCT_ID,
    variantId: 'pernl-vip',
    patch: {discount: 20},
  },
  {
    publishedId: PROMO_ID,
    variantId: 'pernl-local',
    patch: {
      title: 'Fresh today, just for neighbors',
      tagline: 'Skip shipping — pick up your bag fresh from the roastery on the corner.',
      ctaLabel: 'Order for pickup',
    },
  },
  {
    publishedId: LANDING_ID,
    variantId: 'exprm-hero-treatment-b',
    patch: {
      'sections[_key=="hero"].headline': 'Your Best Cup Starts Here',
      'sections[_key=="hero"].subheadline':
        'Small-batch roasts, dialed in fresh every week — taste the difference on your first sip.',
      'sections[_key=="hero"].ctaLabel': 'Try your first bag',
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

async function run() {
  for (const def of DEFINITIONS) {
    try {
      await client.action({
        actionType: 'sanity.action.variant.definition.create',
        variantId: def.variantId,
        conditions: def.conditions ?? {},
        metadata: {title: def.title},
      } satisfies VariantDefinitionCreateAction as unknown as Action)
      console.log(`definition created: ${def.variantId}`)
    } catch (err) {
      console.log(
        `definition skipped (likely exists): ${def.variantId} — ${(err as Error).message}`,
      )
    }
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

  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
