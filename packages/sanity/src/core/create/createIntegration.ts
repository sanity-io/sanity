import {definePlugin} from '../config'
import {CreateIntegrationWrapper} from './components/CreateIntegrationWrapper'
import {createUsEnglishLocaleBundle} from './i18n'
import {createStartInCreateAction} from './start-in-create/StartInCreateAction'
import {createAppIdCache} from './studio-app/appIdCache'

export const createIntegration = definePlugin(() => {
  const appIdCache = createAppIdCache()

  return {
    name: 'sanity/create-integration',

    studio: {
      components: {
        layout: CreateIntegrationWrapper,
      },
    },

    document: {
      actions: [createStartInCreateAction(appIdCache)],
    },

    i18n: {
      bundles: [createUsEnglishLocaleBundle],
    },
  }
})
