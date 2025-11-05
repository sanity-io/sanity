import {visionTool} from '@sanity/vision'
import {createAuthStore, defineConfig} from 'sanity'
import {media, mediaAssetSource} from 'sanity-plugin-media'

export default defineConfig({
  name: 'testing',
  title: 'testing',
  projectId: '1wyn2xo2',
  dataset: 'cms-staging',
  scheduledPublishing: {
    enabled: true,
  },
  plugins: [visionTool(), media()],
  // tools: [clearCache()],
  schema: {
    types: [],
    templates: [],
  },
  document: {
    newDocumentOptions: (prev, {creationContext}) => {
      if (creationContext.type === 'global') {
        return prev.filter(
          (templateItem) =>
            templateItem.templateId != 'settings' &&
            templateItem.templateId != 'dashboardHero' &&
            templateItem.templateId != 'dynamicNews' &&
            templateItem.templateId != 'mobileAppWidgets',
        )
      }

      return prev
    },
    actions: (prev, {schemaType}) => {
      if (
        schemaType === 'settings' ||
        schemaType === 'dashboardHero' ||
        schemaType === 'dynamicNews' ||
        schemaType === 'mobileAppWidgets'
      ) {
        return prev.filter(({action}) => !['unpublish', 'delete', 'duplicate'].includes(action))
      }

      return prev
    },
  },
  form: {
    file: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => assetSource !== mediaAssetSource)
      },
    },
  },
  auth: createAuthStore({
    name: 'testing',
    title: 'testing',
    projectId: '1wyn2xo2',
    dataset: 'cms-staging',
    mode: 'replace',
    redirectOnSingle: false,
    providers: [
      {
        name: 'saml',
        title: 'AWS SSO',
        url: 'https://api.sanity.io/v2023-08-01/auth/saml/login/6fb60ae3',
      },
      {
        name: 'sanity',
        title: 'Email & Password',
        url: 'https://api.sanity.io/v2023-08-01/auth/login/sanity',
      },
    ],
  }),
})
