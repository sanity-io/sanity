import {useDemoState} from './demoState'

// UI chrome — static app strings, not CMS content. Deliberately a *different*
// mechanism from the internationalizedArray plugin: this is what a real app
// combines with CMS-driven i18n (a small dictionary + a lang-aware hook),
// proving the storefront can localize both layers side by side without one
// system knowing about the other.
const UI_STRINGS = {
  en: {
    navHome: 'Home',
    brandBadge: 'demo shop',
    sizeLabel: 'Size',
    grindLabel: 'Grind',
    backToAllCoffees: '← All coffees',
    originUnknown: 'Origin unknown',
    relatedProducts: 'You might also like',
    productNotFound: 'This product was not found for the current perspective.',
    noLandingPage: 'No landing page yet — open the Seed coffee shop tool in the studio workspace.',
    queryFailed: 'Query failed',
    originFrom: (name: string, region?: string) =>
      region ? `From ${name}, ${region}` : `From ${name}`,
    originRoastedFrom: (name: string, region?: string) =>
      region ? `Roasted from ${name}, ${region}` : `Roasted from ${name}`,
  },
  de: {
    navHome: 'Startseite',
    brandBadge: 'Demo-Shop',
    sizeLabel: 'Größe',
    grindLabel: 'Mahlgrad',
    backToAllCoffees: '← Alle Kaffees',
    originUnknown: 'Herkunft unbekannt',
    relatedProducts: 'Das könnte dir auch gefallen',
    productNotFound: 'Dieses Produkt wurde für die aktuelle Perspektive nicht gefunden.',
    noLandingPage:
      'Noch keine Landingpage — öffne das Tool „Seed coffee shop“ im Studio-Workspace.',
    queryFailed: 'Abfrage fehlgeschlagen',
    originFrom: (name: string, region?: string) =>
      region ? `Von ${name}, ${region}` : `Von ${name}`,
    originRoastedFrom: (name: string, region?: string) =>
      region ? `Geröstet aus ${name}, ${region}` : `Geröstet aus ${name}`,
  },
  fr: {
    navHome: 'Accueil',
    brandBadge: 'boutique démo',
    sizeLabel: 'Taille',
    grindLabel: 'Mouture',
    backToAllCoffees: '← Tous nos cafés',
    originUnknown: 'Origine inconnue',
    relatedProducts: 'Vous aimerez aussi',
    productNotFound: "Ce produit n'a pas été trouvé pour la perspective actuelle.",
    noLandingPage:
      "Pas encore de page d'accueil — ouvrez l'outil « Seed coffee shop » dans l'espace de travail Studio.",
    queryFailed: 'Échec de la requête',
    originFrom: (name: string, region?: string) =>
      region ? `De ${name}, ${region}` : `De ${name}`,
    originRoastedFrom: (name: string, region?: string) =>
      region ? `Torréfié depuis ${name}, ${region}` : `Torréfié depuis ${name}`,
  },
} satisfies Record<string, Record<string, string | ((name: string, region?: string) => string)>>

export type UiLang = keyof typeof UI_STRINGS
export type UiStringKey = keyof (typeof UI_STRINGS)['en']

function isSupportedLang(lang: string): lang is UiLang {
  return lang in UI_STRINGS
}

export function useUiStrings() {
  const {lang} = useDemoState()
  return isSupportedLang(lang) ? UI_STRINGS[lang] : UI_STRINGS.en
}
