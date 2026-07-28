import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

type LangMap = Record<string, string>

function i18n(values: LangMap) {
  return Object.entries(values).map(([lang, value]) => ({
    _key: lang,
    _type: 'internationalizedArrayStringValue',
    value,
  }))
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

// --- Base document translations -------------------------------------------------

const HERO_BASE = {
  headline: {en: 'Brew & Bean', de: 'Brew & Bean', fr: 'Brew & Bean'},
  subheadline: {
    en: 'Small-batch roasts, roasted in town and shipped fresh. Coffee for people who care how it tastes.',
    de: 'Kleine Röstungen, in der Stadt geröstet und frisch verschickt. Kaffee für alle, denen der Geschmack wichtig ist.',
    fr: 'Torréfactions en petites quantités, torréfiées en ville et expédiées fraîches. Du café pour ceux qui se soucient du goût.',
  },
  ctaLabel: {en: 'Shop our coffees', de: 'Kaffee entdecken', fr: 'Découvrir nos cafés'},
}

const PROMO_MAIN_BASE = {
  title: {
    en: 'Welcome to Brew & Bean',
    de: 'Willkommen bei Brew & Bean',
    fr: 'Bienvenue chez Brew & Bean',
  },
  tagline: {
    en: 'New here? Enjoy free shipping on your first bag — no code needed at checkout.',
    de: 'Neu hier? Genieße kostenlosen Versand auf deine erste Tüte — kein Code nötig.',
    fr: 'Nouveau ici ? Profitez de la livraison gratuite sur votre premier sachet — aucun code nécessaire.',
  },
  ctaLabel: {en: 'Start shopping', de: 'Jetzt einkaufen', fr: 'Commencer mes achats'},
}

const PROMO_SUBSCRIPTION_BASE = {
  title: {en: 'Subscribe & save'},
  tagline: {en: 'Get a fresh bag every two weeks and never run out of the good stuff.'},
  ctaLabel: {en: 'Build your subscription'},
}

const PRODUCT_TITLES: Record<string, LangMap> = {
  'demo-coffee-product-espresso': {
    en: 'House Espresso Blend',
    de: 'Espresso-Hausmischung',
    fr: 'Mélange Espresso Maison',
  },
  'demo-coffee-product-filter': {en: 'Morning Filter Roast'},
  'demo-coffee-product-cold-brew': {en: 'Cold Brew Concentrate Kit'},
  'demo-coffee-product-decaf': {en: 'Swiss Water Decaf — Evening Blend'},
  'demo-coffee-product-kenya': {en: 'Kenya Nyeri — Limited Microlot'},
  'demo-coffee-product-bundle': {en: 'Starter Bundle — Grinder + Two Bags'},
}

const PRODUCT_EXCERPTS: Record<string, LangMap> = {
  'demo-coffee-product-espresso': {
    en: 'Chocolate, caramel and a clean finish — the blend we pull hundreds of times a day behind the bar.',
    de: 'Schokolade, Karamell und ein klares Finish — die Mischung, die wir hunderte Male am Tag hinter der Theke ziehen.',
    fr: 'Chocolat, caramel et une finale nette — le mélange que nous tirons des centaines de fois par jour derrière le comptoir.',
  },
  'demo-coffee-product-filter': {
    en: 'Juicy, tea-like and luminous — a single-origin pour-over that wakes up your palate.',
  },
  'demo-coffee-product-cold-brew': {
    en: 'Coarse-ground beans, a simple brew guide, and a week of smooth iced coffee in the fridge.',
  },
  'demo-coffee-product-decaf': {
    en: 'All the flavour, none of the caffeine — so you can have a second cup after dinner.',
  },
  'demo-coffee-product-kenya': {
    en: 'Blackcurrant, tomato leaf and brown sugar — a bold, memorable filter coffee.',
  },
  'demo-coffee-product-bundle': {
    en: 'Everything you need to level up home brewing: a hand grinder and two of our best-selling roasts.',
  },
}

// --- Variant-scoped translations -------------------------------------------------

const PERNL_RETURNING_PROMO = {
  title: {en: 'Welcome back!', de: 'Willkommen zurück!', fr: 'Content de vous revoir !'},
  tagline: {
    en: 'Ready for your next bag? Subscribe and never run low.',
    de: 'Bereit für deine nächste Tüte? Abonniere und dir geht nie der gute Kaffee aus.',
    fr: "Prêt pour votre prochain sachet ? Abonnez-vous et n'en manquez plus jamais.",
  },
  ctaLabel: {en: 'Reorder now', de: 'Jetzt nachbestellen', fr: 'Commander à nouveau'},
}

const PERNL_VIP_PROMO = {
  title: {
    en: "You're one of our best customers",
    de: 'Du gehörst zu unseren besten Kunden',
    fr: "Vous êtes l'un de nos meilleurs clients",
  },
  tagline: {
    en: 'Enjoy 20% off, always — our thanks for your loyalty.',
    de: 'Genieße immer 20 % Rabatt — als Dankeschön für deine Treue.',
    fr: 'Profitez de 20 % de réduction, toujours — notre façon de vous remercier de votre fidélité.',
  },
  ctaLabel: {en: 'Shop your discount', de: 'Rabatt einlösen', fr: 'Profiter de la réduction'},
}

const PERNL_LOCAL_PROMO = {
  title: {
    en: 'Fresh today, just for neighbors',
    de: 'Heute frisch, nur für Nachbarn',
    fr: 'Frais aujourd’hui, juste pour les voisins',
  },
  tagline: {
    en: 'Skip shipping — pick up your bag fresh from the roastery on the corner.',
    de: 'Kein Versand nötig — hol dir deine Tüte frisch aus der Rösterei um die Ecke ab.',
    fr: 'Pas besoin de livraison — venez chercher votre sachet frais à la torréfaction du coin.',
  },
  ctaLabel: {en: 'Order for pickup', de: 'Zur Abholung bestellen', fr: 'Commander pour retrait'},
}

const EXPRM_HERO_TREATMENT_B = {
  headline: {
    en: 'Your Best Cup Starts Here',
    de: 'Deine beste Tasse beginnt hier',
    fr: 'Votre meilleure tasse commence ici',
  },
  subheadline: {
    en: 'Small-batch roasts, dialed in fresh every week — taste the difference on your first sip.',
    de: 'Kleine Röstungen, jede Woche frisch abgestimmt — schmecke den Unterschied beim ersten Schluck.',
    fr: 'Torréfactions en petites quantités, ajustées fraîches chaque semaine — goûtez la différence dès la première gorgée.',
  },
  ctaLabel: {en: 'Try your first bag', de: 'Jetzt testen', fr: 'Essayer votre premier sachet'},
}

const PRDVR_SIZE_SMALL_EXCERPT = {
  en: 'The 250g size, modeled as a Content Variant instead of a schema field — compare to the pill selector on the product page.',
  de: 'Die 250-g-Größe, modelliert als Content Variant anstelle eines Schema-Felds — vergleiche mit der Auswahl auf der Produktseite.',
  fr: 'Le format 250 g, modélisé comme une Content Variant plutôt qu’un champ de schéma — à comparer avec le sélecteur sur la page produit.',
}

const PRDVR_SIZE_LARGE_EXCERPT = {
  en: 'The 1kg size, modeled as a Content Variant instead of a schema field — compare to the pill selector on the product page.',
  de: 'Die 1-kg-Größe, modelliert als Content Variant anstelle eines Schema-Felds — vergleiche mit der Auswahl auf der Produktseite.',
  fr: 'Le format 1 kg, modélisé comme une Content Variant plutôt qu’un champ de schéma — à comparer avec le sélecteur sur la page produit.',
}

async function run() {
  // 1. Base documents.
  await client
    .patch('demo-coffee-landing')
    .set({
      'sections[_key=="hero"].headline': i18n(HERO_BASE.headline),
      'sections[_key=="hero"].subheadline': i18n(HERO_BASE.subheadline),
      'sections[_key=="hero"].ctaLabel': i18n(HERO_BASE.ctaLabel),
    })
    .commit({visibility: 'sync'})
  console.log('base: landing hero')

  await client
    .patch('demo-coffee-promo-main')
    .set({
      title: i18n(PROMO_MAIN_BASE.title),
      tagline: i18n(PROMO_MAIN_BASE.tagline),
      ctaLabel: i18n(PROMO_MAIN_BASE.ctaLabel),
    })
    .commit({visibility: 'sync'})
  console.log('base: promo-main')

  await client
    .patch('demo-coffee-promo-subscription')
    .set({
      title: i18n(PROMO_SUBSCRIPTION_BASE.title),
      tagline: i18n(PROMO_SUBSCRIPTION_BASE.tagline),
      ctaLabel: i18n(PROMO_SUBSCRIPTION_BASE.ctaLabel),
    })
    .commit({visibility: 'sync'})
  console.log('base: promo-subscription')

  for (const [id, title] of Object.entries(PRODUCT_TITLES)) {
    const excerpt = PRODUCT_EXCERPTS[id]
    await client
      .patch(id)
      .set({title: i18n(title), excerpt: i18n(excerpt)})
      .commit({visibility: 'sync'})
    console.log(`base: ${id}`)
  }

  // 2. Variant-scoped documents — carry through base en/de/fr for untouched fields,
  //    and translate the variant-specific overrides.
  const espressoTitle = PRODUCT_TITLES['demo-coffee-product-espresso']
  const espressoExcerpt = PRODUCT_EXCERPTS['demo-coffee-product-espresso']

  const scopedPatches: {publishedId: string; variantId: string; patch: Record<string, unknown>}[] =
    [
      {
        publishedId: 'demo-coffee-promo-main',
        variantId: 'pernl-returning',
        patch: {
          title: i18n(PERNL_RETURNING_PROMO.title),
          tagline: i18n(PERNL_RETURNING_PROMO.tagline),
          ctaLabel: i18n(PERNL_RETURNING_PROMO.ctaLabel),
        },
      },
      {
        publishedId: 'demo-coffee-product-espresso',
        variantId: 'pernl-returning',
        patch: {title: i18n(espressoTitle), excerpt: i18n(espressoExcerpt)},
      },
      {
        publishedId: 'demo-coffee-promo-main',
        variantId: 'pernl-vip',
        patch: {
          title: i18n(PERNL_VIP_PROMO.title),
          tagline: i18n(PERNL_VIP_PROMO.tagline),
          ctaLabel: i18n(PERNL_VIP_PROMO.ctaLabel),
        },
      },
      {
        publishedId: 'demo-coffee-product-espresso',
        variantId: 'pernl-vip',
        patch: {title: i18n(espressoTitle), excerpt: i18n(espressoExcerpt)},
      },
      {
        publishedId: 'demo-coffee-promo-main',
        variantId: 'pernl-local',
        patch: {
          title: i18n(PERNL_LOCAL_PROMO.title),
          tagline: i18n(PERNL_LOCAL_PROMO.tagline),
          ctaLabel: i18n(PERNL_LOCAL_PROMO.ctaLabel),
        },
      },
      {
        publishedId: 'demo-coffee-landing',
        variantId: 'exprm-hero-treatment-b',
        patch: {
          'sections[_key=="hero"].headline': i18n(EXPRM_HERO_TREATMENT_B.headline),
          'sections[_key=="hero"].subheadline': i18n(EXPRM_HERO_TREATMENT_B.subheadline),
          'sections[_key=="hero"].ctaLabel': i18n(EXPRM_HERO_TREATMENT_B.ctaLabel),
        },
      },
      {
        publishedId: 'demo-coffee-landing',
        variantId: 'fflag-early-access',
        patch: {
          'sections[_key=="hero"].headline': i18n(HERO_BASE.headline),
          'sections[_key=="hero"].subheadline': i18n(HERO_BASE.subheadline),
          'sections[_key=="hero"].ctaLabel': i18n(HERO_BASE.ctaLabel),
        },
      },
      {
        publishedId: 'demo-coffee-product-espresso',
        variantId: 'prdvr-size-small',
        patch: {title: i18n(espressoTitle), excerpt: i18n(PRDVR_SIZE_SMALL_EXCERPT)},
      },
      {
        publishedId: 'demo-coffee-product-espresso',
        variantId: 'prdvr-size-large',
        patch: {title: i18n(espressoTitle), excerpt: i18n(PRDVR_SIZE_LARGE_EXCERPT)},
      },
    ]

  for (const {publishedId, variantId, patch} of scopedPatches) {
    const scopedId = await findVariantScopedDocId(publishedId, variantId)
    await client.patch(scopedId).set(patch).commit({visibility: 'sync'})
    console.log(`variant: ${variantId} / ${publishedId}`)
  }

  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
