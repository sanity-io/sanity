import {defineLanguage, definePlugin, studioI18nNamespace} from 'sanity'
import {deskI18nNamespace} from 'sanity/desk'
import {NorwegianFlagIcon} from './NorwegianFlagIcon'

const norwegianLanguage = defineLanguage({
  id: 'no-NB',
  title: 'Norsk (Bokmål)',
  icon: NorwegianFlagIcon,
  bundles: [
    {
      namespace: studioI18nNamespace,
      resources: () => import('./bundles/studio'),
    },
    {
      namespace: deskI18nNamespace,
      resources: () => import('./bundles/desk'),
    },
  ],
})

export const noNBLocale = definePlugin({
  name: 'locale-no-nb',
  i18n: {
    languages: (prev) => [
      // Prevent duplicates (move to reducer? remove?)
      ...prev.filter((lang) => lang !== norwegianLanguage),
      norwegianLanguage,
    ],
  },
})
