import {defineLocale, definePlugin} from 'sanity'

const norwegianLanguage = defineLocale({
  id: 'no-NB',
  title: 'Norsk (Bokmål)',
  bundles: [
    {
      namespace: 'studio',
      resources: () => import('./bundles/studio'),
    },
    {
      namespace: 'desk',
      resources: () => import('./bundles/desk'),
    },
    {
      namespace: 'validation',
      resources: () => import('./bundles/validation'),
    },
  ],
})

export const noNBLocale = definePlugin({
  name: 'locale-no-nb',
  i18n: {
    locales: [norwegianLanguage],
  },
})
