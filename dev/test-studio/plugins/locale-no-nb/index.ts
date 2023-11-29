import {defineLocale, definePlugin} from 'sanity'

const norwegianLanguage = defineLocale({
  id: 'no',
  title: 'Norsk (Bokmål)',
  bundles: [
    {
      namespace: 'studio',
      resources: () => import('./bundles/studio'),
    },
    {
      namespace: 'structure',
      resources: () => import('./bundles/structure'),
    },
    {
      namespace: 'validation',
      resources: () => import('./bundles/validation'),
    },
    {
      namespace: 'vision',
      resources: () => import('./bundles/vision'),
    },
  ],
})

const nynorskLanguage = defineLocale({
  id: 'no-NN',
  title: 'Norsk (Nynorsk)',
  bundles: [
    {
      namespace: 'studio',
      resources: {
        'search.placeholder': 'Leit i dokumentar',
      },
    },
  ],
})

export const noNBLocale = definePlugin({
  name: 'locale-no',
  i18n: {
    locales: [norwegianLanguage],
  },
})

export const noNNLocale = definePlugin({
  name: 'locale-no-nn',
  i18n: {
    locales: [nynorskLanguage],
  },
})
