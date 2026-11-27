import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: 'X'}).withConfig({dataset: 'coffee-shop'})

type LangMap = Record<string, string>

function i18n(values: LangMap) {
  return Object.entries(values).map(([lang, value]) => ({
    _key: lang,
    _type: 'internationalizedArrayStringValue',
    language: lang,
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

// --- Origins --------------------------------------------------------------------

const ORIGIN_REGIONS: Record<string, LangMap> = {
  'demo-coffee-origin-ethiopia': {en: 'Ethiopia', de: 'Äthiopien', fr: 'Éthiopie'},
  'demo-coffee-origin-colombia': {en: 'Colombia', de: 'Kolumbien', fr: 'Colombie'},
  'demo-coffee-origin-brazil': {en: 'Brazil', de: 'Brasilien', fr: 'Brésil'},
  'demo-coffee-origin-guatemala': {en: 'Guatemala', de: 'Guatemala', fr: 'Guatemala'},
  'demo-coffee-origin-kenya': {en: 'Kenya', de: 'Kenia', fr: 'Kenya'},
}

// --- Remaining products -----------------------------------------------------------

const PRODUCT_TITLES: Record<string, LangMap> = {
  'demo-coffee-product-filter': {
    en: 'Morning Filter Roast',
    de: 'Morgen-Filterröstung',
    fr: 'Torréfaction Filtre du Matin',
  },
  'demo-coffee-product-cold-brew': {
    en: 'Cold Brew Concentrate Kit',
    de: 'Cold-Brew-Konzentrat-Set',
    fr: 'Kit Concentré Cold Brew',
  },
  'demo-coffee-product-decaf': {
    en: 'Swiss Water Decaf — Evening Blend',
    de: 'Swiss-Water-Entkoffeiniert — Abendmischung',
    fr: 'Décaféiné Swiss Water — Mélange du Soir',
  },
  'demo-coffee-product-kenya': {
    en: 'Kenya Nyeri — Limited Microlot',
    de: 'Kenia Nyeri — Limitiertes Microlot',
    fr: 'Kenya Nyeri — Microlot Limité',
  },
  'demo-coffee-product-bundle': {
    en: 'Starter Bundle — Grinder + Two Bags',
    de: 'Starter-Set — Mühle + Zwei Tüten',
    fr: 'Kit de Démarrage — Moulin + Deux Sachets',
  },
}

const PRODUCT_EXCERPTS: Record<string, LangMap> = {
  'demo-coffee-product-filter': {
    en: 'Juicy, tea-like and luminous — a single-origin pour-over that wakes up your palate.',
    de: 'Saftig, teeartig und strahlend — ein Single-Origin-Filterkaffee, der deinen Gaumen weckt.',
    fr: 'Juteux, proche du thé et lumineux — un café filtre mono-origine qui réveille votre palais.',
  },
  'demo-coffee-product-cold-brew': {
    en: 'Coarse-ground beans, a simple brew guide, and a week of smooth iced coffee in the fridge.',
    de: 'Grob gemahlene Bohnen, eine einfache Brühanleitung und eine Woche cremigen Eiskaffee im Kühlschrank.',
    fr: 'Café moulu grossièrement, un guide de préparation simple et une semaine de café glacé onctueux au réfrigérateur.',
  },
  'demo-coffee-product-decaf': {
    en: 'All the flavour, none of the caffeine — so you can have a second cup after dinner.',
    de: 'Der volle Geschmack, ohne Koffein — für eine zweite Tasse nach dem Abendessen.',
    fr: 'Toute la saveur, sans caféine — pour une seconde tasse après le dîner.',
  },
  'demo-coffee-product-kenya': {
    en: 'Blackcurrant, tomato leaf and brown sugar — a bold, memorable filter coffee.',
    de: 'Schwarze Johannisbeere, Tomatenblatt und brauner Zucker — ein kräftiger, unvergesslicher Filterkaffee.',
    fr: 'Cassis, feuille de tomate et sucre roux — un café filtre audacieux et mémorable.',
  },
  'demo-coffee-product-bundle': {
    en: 'Everything you need to level up home brewing: a hand grinder and two of our best-selling roasts.',
    de: 'Alles, was du brauchst, um dein Zuhause-Brühen aufzuwerten: eine Handmühle und zwei unserer meistverkauften Röstungen.',
    fr: "Tout ce qu'il vous faut pour sublimer votre café maison : un moulin manuel et deux de nos torréfactions les plus vendues.",
  },
}

// --- Promo subscription ------------------------------------------------------------

const PROMO_SUBSCRIPTION = {
  title: {en: 'Subscribe & save', de: 'Abonnieren & sparen', fr: 'Abonnez-vous et économisez'},
  tagline: {
    en: 'Get a fresh bag every two weeks and never run out of the good stuff.',
    de: 'Erhalte alle zwei Wochen eine frische Tüte und dir geht nie der gute Kaffee aus.',
    fr: "Recevez un sachet frais toutes les deux semaines et n'en manquez plus jamais.",
  },
  ctaLabel: {
    en: 'Build your subscription',
    de: 'Abo erstellen',
    fr: 'Créer mon abonnement',
  },
}

// --- Landing page sections ----------------------------------------------------------

const SECTION_TEXT = {
  featuredHeading: {en: 'Our coffees', de: 'Unsere Kaffees', fr: 'Nos cafés'},
  storyHeading: {
    en: 'Roasted for the cup, not the shelf',
    de: 'Geröstet für die Tasse, nicht fürs Regal',
    fr: "Torréfié pour la tasse, pas pour l'étagère",
  },
  originsHeading: {
    en: 'Where the beans come from',
    de: 'Woher die Bohnen kommen',
    fr: 'D’où viennent nos grains',
  },
  ctaHeading: {
    en: 'Ready for a better morning?',
    de: 'Bereit für einen besseren Morgen?',
    fr: 'Prêt pour un meilleur matin ?',
  },
  ctaBody: {
    en: 'Pick a bag, brew it your way, and taste the difference fresh roasting makes.',
    de: 'Wähle eine Tüte, brühe sie auf deine Art und schmecke den Unterschied, den frisches Rösten macht.',
    fr: 'Choisissez un sachet, préparez-le à votre façon et goûtez la différence qu’apporte une torréfaction fraîche.',
  },
  ctaButtonLabel: {en: 'Browse all coffees', de: 'Alle Kaffees ansehen', fr: 'Voir tous nos cafés'},
}

function sectionPatch() {
  return {
    'sections[_key=="featured"].heading': i18n(SECTION_TEXT.featuredHeading),
    'sections[_key=="story"].heading': i18n(SECTION_TEXT.storyHeading),
    'sections[_key=="origins"].heading': i18n(SECTION_TEXT.originsHeading),
    'sections[_key=="cta"].heading': i18n(SECTION_TEXT.ctaHeading),
    'sections[_key=="cta"].body': i18n(SECTION_TEXT.ctaBody),
    'sections[_key=="cta"].buttonLabel': i18n(SECTION_TEXT.ctaButtonLabel),
  }
}

async function run() {
  for (const [id, region] of Object.entries(ORIGIN_REGIONS)) {
    await client
      .patch(id)
      .set({region: i18n(region)})
      .commit({visibility: 'sync'})
    console.log(`origin: ${id}`)
  }

  for (const [id, title] of Object.entries(PRODUCT_TITLES)) {
    const excerpt = PRODUCT_EXCERPTS[id]
    await client
      .patch(id)
      .set({title: i18n(title), excerpt: i18n(excerpt)})
      .commit({visibility: 'sync'})
    console.log(`product: ${id}`)
  }

  await client
    .patch('demo-coffee-promo-subscription')
    .set({
      title: i18n(PROMO_SUBSCRIPTION.title),
      tagline: i18n(PROMO_SUBSCRIPTION.tagline),
      ctaLabel: i18n(PROMO_SUBSCRIPTION.ctaLabel),
    })
    .commit({visibility: 'sync'})
  console.log('promo-subscription')

  // Base landing page + both landing-page variant copies all need the same
  // section text migrated (they were full copies at creation time, before
  // these fields existed as internationalizedArrayString).
  await client.patch('demo-coffee-landing').set(sectionPatch()).commit({visibility: 'sync'})
  console.log('landing: base')

  const treatmentId = await findVariantScopedDocId('demo-coffee-landing', 'exprm-hero-treatment-b')
  await client.patch(treatmentId).set(sectionPatch()).commit({visibility: 'sync'})
  console.log('landing: exprm-hero-treatment-b')

  const flagId = await findVariantScopedDocId('demo-coffee-landing', 'fflag-early-access')
  await client.patch(flagId).set(sectionPatch()).commit({visibility: 'sync'})
  console.log('landing: fflag-early-access')

  console.log('done')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
