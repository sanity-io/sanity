import {type Action} from '@sanity/client'
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

const LANDING_ID = 'demo-coffee-landing'
const VARIANT_ID = 'early-access'

// Not in @sanity/client's public `Action` union yet — see
// packages/sanity/src/core/variants/ACTIONS.md for the authoritative shape.
interface VariantDocumentCreateAction {
  actionType: 'sanity.action.document.variant.create'
  publishedId: string
  variantId: string
  baseId: string
}

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
  try {
    await client.action({
      actionType: 'sanity.action.document.variant.create',
      publishedId: LANDING_ID,
      variantId: VARIANT_ID,
      baseId: LANDING_ID,
    } satisfies VariantDocumentCreateAction as unknown as Action)
    console.log('variant doc created')
  } catch (err) {
    console.log(`variant doc create skipped (likely exists): ${(err as Error).message}`)
  }

  const scopedId = await findVariantScopedDocId(LANDING_ID, VARIANT_ID)
  console.log('scoped id:', scopedId)

  await client
    .patch(scopedId)
    // Right after the hero (index 0), not at the end — so the flag's effect is
    // visible without scrolling.
    .insert('after', 'sections[0]', [
      {
        _type: 'promoBanner',
        _key: 'early-access-beta',
        title: 'New: Subscribe & Save — Beta',
        tagline:
          "You're on the early access list. Lock in a subscription before it opens to everyone.",
        ctaLabel: 'Join the beta',
      },
    ])
    .commit({visibility: 'sync'})

  console.log('patched: early-access section inserted')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
