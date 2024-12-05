import {definePlugin} from '../config'
import {CreateIntegrationWrapper} from './components/CreateIntegrationWrapper'
import {createUsEnglishLocaleBundle} from './i18n'

export const createIntegration = definePlugin(() => {
  return {
    name: 'sanity/create-integration',

    studio: {
      components: {
        layout: CreateIntegrationWrapper,
      },
    },

    i18n: {
      bundles: [createUsEnglishLocaleBundle],
    },
  }
})
