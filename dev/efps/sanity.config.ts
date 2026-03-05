import {defineConfig} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'

import {apiConfig} from './apiConfig'
import {arrayI18nEfps} from './tests/arrayI18n/sanity.config'
import {articleEfps} from './tests/article/sanity.config'
import {recipeEfps} from './tests/recipe/sanity.config'
import {singleStringEfps} from './tests/singleString/sanity.config'
import {syntheticEfps} from './tests/synthetic/sanity.config'

const common = {
  ...apiConfig,
  plugins: [
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'es', title: 'Spanish'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
    }),
  ],
  scheduledPublishing: {
    enabled: false,
  },
  releases: {
    enabled: false,
  },
}

export default defineConfig([
  {
    basePath: '/arrayI18n',
    ...common,
    ...arrayI18nEfps,
    plugins: [...common.plugins, ...arrayI18nEfps.plugins],
  },
  {
    basePath: '/article',
    ...common,
    ...articleEfps,
    plugins: [...common.plugins, ...articleEfps.plugins],
  },
  {
    basePath: '/recipe',
    ...common,
    ...recipeEfps,
    plugins: [...common.plugins, ...recipeEfps.plugins],
  },
  {
    basePath: '/synthetic',
    ...common,
    ...syntheticEfps,
    plugins: [...common.plugins, ...syntheticEfps.plugins],
  },
  {
    basePath: '/singleString',
    ...common,
    ...singleStringEfps,
    plugins: [...common.plugins, ...singleStringEfps.plugins],
  },
])
