import {type Action} from '@sanity/client'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

// Not in @sanity/client's public `Action` union yet — see
// packages/sanity/src/core/variants/ACTIONS.md for the authoritative shape.
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

const HERO_PRODUCT_ID = 'demo-coffee-product-espresso'

// Deliberately the same price points as the schema-based sizeOptions on this same
// product, so the two approaches can be compared directly on the same numbers.
const DEFINITIONS = [
  {
    variantId: 'prdvr-size-small',
    conditions: {size: 'small'},
    title: 'Product variant (alt.): Size — 250g',
  },
  {
    variantId: 'prdvr-size-large',
    conditions: {size: 'large'},
    title: 'Product variant (alt.): Size — 1kg',
  },
]

const PATCHES = [
  {
    variantId: 'prdvr-size-small',
    patch: {
      price: 14,
      excerpt:
        'The 250g size, modeled as a Content Variant instead of a schema field — compare to the pill selector on the product page.',
    },
  },
  {
    variantId: 'prdvr-size-large',
    patch: {
      price: 48,
      excerpt:
        'The 1kg size, modeled as a Content Variant instead of a schema field — compare to the pill selector on the product page.',
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
        conditions: def.conditions,
        metadata: {title: def.title},
      } satisfies VariantDefinitionCreateAction as unknown as Action)
      console.log(`definition created: ${def.variantId}`)
    } catch (err) {
      console.log(
        `definition skipped (likely exists): ${def.variantId} — ${(err as Error).message}`,
      )
    }

    try {
      await client.action({
        actionType: 'sanity.action.document.variant.create',
        publishedId: HERO_PRODUCT_ID,
        variantId: def.variantId,
        baseId: HERO_PRODUCT_ID,
      } satisfies VariantDocumentCreateAction as unknown as Action)
      console.log(`variant doc created: ${def.variantId}`)
    } catch (err) {
      console.log(
        `variant doc create skipped (likely exists): ${def.variantId} — ${(err as Error).message}`,
      )
    }
  }

  for (const {variantId, patch} of PATCHES) {
    const scopedId = await findVariantScopedDocId(HERO_PRODUCT_ID, variantId)
    await client.patch(scopedId).set(patch).commit({visibility: 'sync'})
    console.log(`patched: ${variantId}`)
  }

  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
