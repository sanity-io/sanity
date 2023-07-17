import {defineLocale, definePlugin, studioLocaleNamespace} from 'sanity'
import {deskLocaleNamespace} from 'sanity/desk'
import {NorwegianFlagIcon} from './NorwegianFlagIcon'

const norwegianLanguage = defineLocale({
  id: 'no-NB',
  title: 'Norsk (Bokmål)',
  icon: NorwegianFlagIcon,
  bundles: [
    {
      namespace: studioLocaleNamespace,
      resources: () => import('./bundles/studio'),
    },
    {
      namespace: deskLocaleNamespace,
      resources: () => import('./bundles/desk'),
    },
  ],
})

export const noNBLocale = definePlugin({
  name: 'locale-no-nb',
  i18n: {
    locales: [norwegianLanguage],
  },
})
