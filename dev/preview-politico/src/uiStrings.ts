import {useDemoState} from './demoState'

// UI chrome — static app strings, not CMS content (same split as the coffee shop
// demo's uiStrings.ts). Politico's real localization rollout targets EN/FR/DE/ES;
// this demo covers EN/FR/ES for the UI shell — a deliberately light touch since
// localization is a stated V1 non-goal, not the point being pitched here.
const UI_STRINGS = {
  en: {
    navHome: 'Home',
    brandBadge: 'demo',
    backToHome: '← Back to Home',
    articleNotFound: 'This article was not found for the current perspective.',
    noHomePage: 'No home page yet — run the seed script against the politico dataset.',
    queryFailed: 'Query failed',
    sponsoredLabel: 'Sponsored content',
    proLabel: 'POLITICO Pro',
    proTeaserCta: 'Unlock with POLITICO Pro',
  },
  fr: {
    navHome: 'Accueil',
    brandBadge: 'démo',
    backToHome: "← Retour à l'accueil",
    articleNotFound: "Cet article n'a pas été trouvé pour la perspective actuelle.",
    noHomePage:
      "Pas encore de page d'accueil — exécutez le script de seed sur le dataset politico.",
    queryFailed: 'Échec de la requête',
    sponsoredLabel: 'Contenu sponsorisé',
    proLabel: 'POLITICO Pro',
    proTeaserCta: 'Débloquer avec POLITICO Pro',
  },
  es: {
    navHome: 'Inicio',
    brandBadge: 'demo',
    backToHome: '← Volver al inicio',
    articleNotFound: 'No se encontró este artículo para la perspectiva actual.',
    noHomePage: 'Aún no hay página de inicio — ejecuta el script de seed en el dataset politico.',
    queryFailed: 'Error en la consulta',
    sponsoredLabel: 'Contenido patrocinado',
    proLabel: 'POLITICO Pro',
    proTeaserCta: 'Desbloquear con POLITICO Pro',
  },
} satisfies Record<string, Record<string, string>>

export type UiLang = keyof typeof UI_STRINGS
export type UiStringKey = keyof (typeof UI_STRINGS)['en']

function isSupportedLang(lang: string): lang is UiLang {
  return lang in UI_STRINGS
}

export function useUiStrings() {
  const {lang} = useDemoState()
  return isSupportedLang(lang) ? UI_STRINGS[lang] : UI_STRINGS.en
}
