import {type IdentifiedSanityDocumentStub, type SanityClient} from '@sanity/client'

/**
 * Seeds the base (published) demo content: origins, promos, and six coffee products with full
 * descriptions. Idempotent — deterministic ids with `createIfNotExists`, so it never overwrites
 * demo prep.
 *
 * Variant content is deliberately NOT seeded: creating the variant and overriding product
 * discounts (or promo copy) through the studio is the demo.
 */
export async function seedDemoContent(client: SanityClient): Promise<void> {
  const block = (key: string, text: string) => ({
    _type: 'block' as const,
    _key: key,
    style: 'normal' as const,
    markDefs: [],
    children: [{_type: 'span' as const, _key: `${key}-span`, text, marks: [] as string[]}],
  })

  const origins = [
    {
      _id: 'demo-coffee-origin-ethiopia',
      _type: 'demoCoffeeOrigin',
      name: 'Yirgacheffe',
      region: 'Ethiopia',
    },
    {
      _id: 'demo-coffee-origin-colombia',
      _type: 'demoCoffeeOrigin',
      name: 'Huila',
      region: 'Colombia',
    },
    {
      _id: 'demo-coffee-origin-brazil',
      _type: 'demoCoffeeOrigin',
      name: 'Minas Gerais',
      region: 'Brazil',
    },
    {
      _id: 'demo-coffee-origin-guatemala',
      _type: 'demoCoffeeOrigin',
      name: 'Huehuetenango',
      region: 'Guatemala',
    },
    {
      _id: 'demo-coffee-origin-kenya',
      _type: 'demoCoffeeOrigin',
      name: 'Nyeri',
      region: 'Kenya',
    },
  ]

  const promos = [
    {
      _id: 'demo-coffee-promo-main',
      _type: 'demoCoffeePromo',
      title: 'Welcome to Brew & Bean',
      tagline: 'New here? Enjoy free shipping on your first bag — no code needed at checkout.',
      ctaLabel: 'Start shopping',
    },
    {
      _id: 'demo-coffee-promo-subscription',
      _type: 'demoCoffeePromo',
      title: 'Subscribe & save',
      tagline: 'Get a fresh bag every two weeks and never run out of the good stuff.',
      ctaLabel: 'Build your subscription',
    },
  ]

  const products = [
    {
      _id: 'demo-coffee-product-espresso',
      _type: 'demoCoffeeProduct',
      title: 'House Espresso Blend',
      excerpt:
        'Chocolate, caramel and a clean finish — the blend we pull hundreds of times a day behind the bar.',
      price: 18,
      discount: 0,
      description: [
        block(
          'espresso-1',
          'Our house espresso is the backbone of Brew & Bean. We built it for consistency first: every shot should taste balanced whether you drink it straight or with oat milk. The base is a naturally processed Brazilian lot from Minas Gerais that brings milk chocolate and a soft, nutty sweetness. On top of that we layer a washed Colombian from Huila for structure and a hint of red apple acidity.',
        ),
        block(
          'espresso-2',
          'We roast to a medium-dark profile — dark enough to cut through milk, light enough that you can still taste origin character in a doppio. In the cup you get caramel, cocoa nib and a clean, lingering finish without the burnt bitterness that gives espresso a bad name. It is forgiving to dial in: if your grinder is a little off, the blend still tastes like coffee you want another sip of.',
        ),
        block(
          'espresso-3',
          'Behind the bar we pull at 18 g in, 36 g out, in roughly 28 seconds. At home, start there and adjust grind until the timing feels right. Best within four weeks of the roast date printed on the bag. Store airtight, away from light and heat.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-colombia'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-main'},
    },
    {
      _id: 'demo-coffee-product-filter',
      _type: 'demoCoffeeProduct',
      title: 'Morning Filter Roast',
      excerpt:
        'Juicy, tea-like and luminous — a single-origin pour-over that wakes up your palate.',
      price: 16,
      discount: 0,
      description: [
        block(
          'filter-1',
          'This is the coffee we reach for when the sun is up and we want something bright. A washed Ethiopian Yirgacheffe, light roasted to preserve the delicate aromatics that make this origin famous. On the nose: jasmine, bergamot and a whisper of peach. In the cup: black tea, lemon zest and a honeyed sweetness that builds as the coffee cools.',
        ),
        block(
          'filter-2',
          'We source this lot through a long-standing relationship with a cooperative in the Kochere woreda. Farmers pick ripe cherries, depulp the same day and dry on raised beds for two to three weeks. That careful processing is what gives you clarity — no muddy notes, just a clean, sparkling cup that rewards patience.',
        ),
        block(
          'filter-3',
          'Designed for V60, Chemex and batch brew. We like a 1:16 ratio (15 g coffee to 240 ml water), water at 94 °C, and a gentle pour that keeps agitation low. The first sip should feel almost like tea; the last sip should still be sweet. If it tastes sharp, grind a touch finer or shorten the brew time.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-ethiopia'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-subscription'},
    },
    {
      _id: 'demo-coffee-product-cold-brew',
      _type: 'demoCoffeeProduct',
      title: 'Cold Brew Concentrate Kit',
      excerpt:
        'Coarse-ground beans, a simple brew guide, and a week of smooth iced coffee in the fridge.',
      price: 22,
      discount: 0,
      description: [
        block(
          'cold-1',
          'Cold brew should be easy and it should taste good on day seven, not just day one. This kit ships 340 g of coarse-ground coffee — a chocolate-forward Colombian lot we select specifically for long, cool extractions. Steep 12 hours and you get a concentrate that is smooth, low-acid and naturally sweet without adding sugar.',
        ),
        block(
          'cold-2',
          'The included card walks you through immersion in a jar or French press: 1 part coffee to 8 parts cold water, refrigerated, then filtered. Dilute the concentrate 1:1 with water or milk for iced coffee, or 1:2 for something lighter. One batch makes roughly eight to ten servings depending on how strong you like it.',
        ),
        block(
          'cold-3',
          'No special gear required beyond a jar and a filter. Keep the concentrate sealed in the fridge for up to ten days. If you prefer hot coffee, this lot also works as a full-immersion brew — but we think it shines over ice with a splash of cream.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-colombia'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-main'},
    },
    {
      _id: 'demo-coffee-product-decaf',
      _type: 'demoCoffeeProduct',
      title: 'Swiss Water Decaf — Evening Blend',
      excerpt: 'All the flavour, none of the caffeine — so you can have a second cup after dinner.',
      price: 17,
      discount: 0,
      description: [
        block(
          'decaf-1',
          'Decaf has a reputation it does not deserve. This blend uses the Swiss Water Process — no chemical solvents, just water, time and careful monitoring until 99.9% of the caffeine is gone while the flavour compounds stay put. The base is a Guatemala Huehuetenango with milk chocolate and orange zest; we round it out with a small amount of Brazilian for body.',
        ),
        block(
          'decaf-2',
          'Roasted medium, it works in any brewer you already own. In a French press you get a velvety, comforting cup; as pour-over it stays sweet and balanced without the hollow flavour that cheap decaf often has. We drink this ourselves on late shifts behind the bar, so we are picky about it.',
        ),
        block(
          'decaf-3',
          'If you are sensitive to caffeine or just want coffee after 4 pm without lying awake, this is the bag to keep on the shelf. Brew it exactly like your regular coffee — same dose, same grind, same ritual.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-guatemala'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-main'},
    },
    {
      _id: 'demo-coffee-product-kenya',
      _type: 'demoCoffeeProduct',
      title: 'Kenya Nyeri — Limited Microlot',
      excerpt: 'Blackcurrant, tomato leaf and brown sugar — a bold, memorable filter coffee.',
      price: 24,
      discount: 0,
      description: [
        block(
          'kenya-1',
          'Kenya is not subtle, and we would not want it to be. This microlot from smallholders in Nyeri county is double-washed and dried on raised beds under careful supervision. The result is the classic Kenya profile: intense blackcurrant and cranberry acidity, a savoury tomato-leaf note that sounds strange on paper but makes sense in the cup, and a brown-sugar sweetness underneath it all.',
        ),
        block(
          'kenya-2',
          'We buy only a few bags each season. When it is gone, it is gone until next year’s harvest. Light roasted to keep that acidity vivid. Best as pour-over or AeroPress — methods where you can control extraction and let the complexity unfold across sips.',
        ),
        block(
          'kenya-3',
          'Try 15 g to 250 ml water at 93 °C. The first pour should wet all the grounds; let it bloom for 45 seconds before continuing. If the cup tastes too intense, coarsen the grind slightly or add a few degrees of water temperature. This is a coffee for people who want to pay attention.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-kenya'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-subscription'},
    },
    {
      _id: 'demo-coffee-product-bundle',
      _type: 'demoCoffeeProduct',
      title: 'Starter Bundle — Grinder + Two Bags',
      excerpt:
        'Everything you need to level up home brewing: a hand grinder and two of our best-selling roasts.',
      price: 89,
      discount: 0,
      description: [
        block(
          'bundle-1',
          'The single biggest upgrade most home brewers can make is not a new machine — it is a better grinder. Uneven particles extract at different rates, so you taste sour and bitter at the same time and wonder why the café cup is so much better. This bundle pairs our entry-level hand grinder with two 340 g bags: House Espresso Blend and Morning Filter Roast.',
        ),
        block(
          'bundle-2',
          'The grinder uses steel burrs and a simple click adjustment. It is not the fastest, but it is consistent enough that you will hear the difference on the first brew. We include a printed dial-in guide for both bags — dose, grind setting and a starting recipe for V60 and espresso-style moka pot.',
        ),
        block(
          'bundle-3',
          'Shipped together in one box. If you already own a capable grinder, this bundle is not for you — grab the individual bags instead. If you are starting out or still using a blade grinder, this is the kit we recommend to friends who ask what to buy first.',
        ),
      ],
      origin: {_type: 'reference', _ref: 'demo-coffee-origin-brazil'},
      promo: {_type: 'reference', _ref: 'demo-coffee-promo-main'},
    },
  ]

  const documents: IdentifiedSanityDocumentStub[] = [...origins, ...promos, ...products]
  let transaction = client.transaction()
  for (const doc of documents) {
    transaction = transaction.createIfNotExists(doc)
  }
  await transaction.commit({visibility: 'sync'})
}
