import {colorInput} from '@sanity/color-input'
import {debugSecrets} from '@sanity/debug-preview-url-secret-plugin'
import {documentInternationalization} from '@sanity/document-internationalization'
import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon, EnvelopeIcon, MobileDeviceIcon, PresentationIcon} from '@sanity/icons'
import {SanityMonogram} from '@sanity/logos'
import {visionTool} from '@sanity/vision'
import {defineConfig, definePlugin, type WorkspaceOptions} from 'sanity'
import {unsplashAssetSource} from 'sanity-plugin-asset-source-unsplash'
import {imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {markdownSchema} from 'sanity-plugin-markdown'
import {media} from 'sanity-plugin-media'
import {muxInput} from 'sanity-plugin-mux-input'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {imageAssetSource} from './assetSources'
import {
  CustomBadge,
} from './components/formComponents'


import {resolveDocumentActions as documentActions} from './documentActions'
import {useTestVersionAction} from './documentActions/actions/TestVersionAction'
import {assistFieldActionGroup} from './fieldActions/assistFieldActionGroup'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {customInspector} from './inspectors/custom'
import {testStudioLocaleBundles} from './locales'
import {errorReportingTestPlugin} from './plugins/error-reporting-test'
import {formBuilderReproTool} from './plugins/form-builder-repro'
import {autoCloseBrackets} from './plugins/input/auto-close-brackets-plugin'
import {wave} from './plugins/input/wave-plugin'
import {languageFilter} from './plugins/language-filter'
import {routerDebugTool} from './plugins/router-debug'
import {useArchiveAndDeleteCustomAction} from './releases/customReleaseActions'
import {createSchemaTypes} from './schema'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'

// @ts-expect-error - defined by vite
const isStaging = globalThis.__SANITY_STAGING__ === true

const envConfig = {
  // use this for production workspaces
  production: isStaging ? {apiHost: 'https://api.sanity.io'} : {},
  // use this for staging workspaces
  staging: isStaging ? {} : {apiHost: 'https://api.sanity.work'},
}

const sharedSettings = ({projectId}: {projectId: string}) => {
  return definePlugin({
    name: 'sharedSettings',
    schema: {
      types: createSchemaTypes(projectId),
      templates: resolveInitialValueTemplates,
    },
    form: {
      image: {
        assetSources: [imageAssetSource, unsplashAssetSource],
      },
      file: {
        assetSources: [imageAssetSource],
      },
    },

    i18n: {
      bundles: testStudioLocaleBundles,
    },

    mediaLibrary: {
      enabled: true,
    },

    advancedVersionControl: {
      enabled: true,
    },

    document: {
      actions: documentActions,
      inspectors: (prev, ctx) => {
        if (ctx.documentType === 'inspectorsTest') {
          return [customInspector, ...prev]
        }

        return prev
      },
      unstable_fieldActions: (prev, ctx) => {
        const defaultActions = [...prev]

        if (['fieldActionsTest', 'stringsTest'].includes(ctx.documentType)) {
          return [...defaultActions, assistFieldActionGroup]
        }

        return defaultActions
      },
      newDocumentOptions,
      comments: {
        enabled: true,
      },
      badges: (prev, context) => (context.schemaType === 'author' ? [CustomBadge, ...prev] : prev),
    },
    plugins: [
      structureTool({
        icon: BookIcon,
        structure,
        defaultDocumentNode,
      }),
      debugSecrets(),
      presentationTool({
        allowOrigins: ['https://*.sanity.dev', 'http://localhost:*'],
        previewUrl: '/preview/index.html',
        resolve: {
          mainDocuments: defineDocuments([
            {
              route: '/preview/index.html',
              filter: `_type == "simpleBlock" && isMain`,
            },
          ]),
          locations: {
            simpleBlock: defineLocations({
              select: {title: 'title'},
              resolve: (doc) => {
                if (!doc?.title) return {}
                return {
                  locations: [
                    {
                      title: doc.title,
                      href: `/preview/index.html?${new URLSearchParams({title: doc.title})}`,
                    },
                  ],
                }
              },
            }),
            // Test document type for verifying DocumentLocation icon and showHref properties
            locationResolverTest: defineLocations({
              select: {title: 'title', slug: 'slug.current'},
              resolve: (doc) => {
                if (!doc?.title) return {message: 'Add a title to see locations', tone: 'caution'}
                return {
                  locations: [
                    {
                      title: 'Email Client View',
                      href: `/newsletter/${doc.slug ?? 'untitled'}/email`,
                      icon: EnvelopeIcon,
                      showHref: false,
                    },
                    {
                      title: 'Web View',
                      href: `/newsletter/${doc.slug ?? 'untitled'}`,
                      // Uses defaults: DesktopIcon, showHref: true
                    },
                    {
                      title: 'Mobile App',
                      href: `/newsletter/${doc.slug ?? 'untitled'}/app`,
                      icon: MobileDeviceIcon,
                      showHref: false,
                    },
                    {
                      title: 'In-store Display',
                      href: `/newsletter/${doc.slug ?? 'untitled'}/display`,
                      icon: PresentationIcon,
                      showHref: false,
                    },
                  ],
                  message: 'Preview this content in different contexts',
                }
              },
            }),
          },
        },
      }),
      languageFilter({
        defaultLanguages: ['nb'],
        supportedLanguages: [
          {id: 'ar', title: 'Arabic'},
          {id: 'en', title: 'English'},
          {id: 'nb', title: 'Norwegian (bokmål)'},
          {id: 'nn', title: 'Norwegian (nynorsk)'},
          {id: 'pt', title: 'Portuguese'},
          {id: 'es', title: 'Spanish'},
        ],
        types: ['languageFilterDebug'],
      }),
      googleMapsInput({
        apiKey: 'AIzaSyDDO2FFi5wXaQdk88S1pQUa70bRtWuMhkI',
        defaultZoom: 11,
        defaultLocation: {
          lat: 40.7058254,
          lng: -74.1180863,
        },
      }),
      colorInput(),
      visionTool({
        // uncomment to test
        //defaultApiVersion: '2025-02-05',
      }),
      // eslint-disable-next-line camelcase
      muxInput({mp4_support: 'standard'}),
      imageHotspotArrayPlugin(),
      routerDebugTool(),
      formBuilderReproTool(),
      errorReportingTestPlugin(),
      media(),
      markdownSchema(),
      wave(),
      autoCloseBrackets(),
      internationalizedArray({
        languages: [
          {id: 'en', title: 'English'},
          {id: 'fr', title: 'French'},
        ],
        defaultLanguages: ['en'],
        fieldTypes: ['string'],
      }),
      documentInternationalization({
        supportedLanguages: [
          {id: 'en', title: 'English'},
          {id: 'fr', title: 'French'},
          {id: 'es', title: 'Spanish'},
          {id: 'de', title: 'German'},
        ],
        schemaTypes: ['documentI18nTest'],
      }),
    ],
  })()
}

const defaultWorkspace = defineConfig({
  name: 'default',
  title: 'Test Studio',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  ...envConfig.production,
  plugins: [sharedSettings({projectId: 'ppsg7ml5'})],

  onUncaughtError: (error, errorInfo) => {
    console.log(error)
    console.log(errorInfo)
  },
  basePath: '/test',
  icon: SanityMonogram,
  scheduledPublishing: {
    enabled: true,
    inputDateTimeFormat: 'MM/dd/yy h:mm a',
  },
  tasks: {
    enabled: true,
  },
  mediaLibrary: {
    enabled: true,
  },
  document: {
    actions: (prev, ctx) => {
      if (ctx.schemaType === 'book' && ctx.releaseId) {
        return [useTestVersionAction, ...prev]
      }
      if (ctx.schemaType === 'author' && ctx.releaseId) {
        return [...prev, useTestVersionAction]
      }
      if (ctx.schemaType === 'playlist') {
        return prev.filter(({action}) => action === 'delete')
      }

      return prev
    },
  },
  releases: {
    actions: (prev, ctx) => {
      if (ctx.release.state === 'active') {
        return [...prev, useArchiveAndDeleteCustomAction]
      }
      return prev
    },
  },
  beta: {
    variants: {
      enabled: true,
    },
  },
})

export default defineConfig([
  {
    name: 'staging',
    title: 'Staging',
    subtitle: 'Staging dataset',
    projectId: 'exx11uqh',
    dataset: 'playground',
    ...envConfig.staging,
    plugins: [sharedSettings({projectId: 'exx11uqh'})],
    basePath: '/staging',
    auth: {
      loginMethod: 'token',
    },
    unstable_tasks: {
      enabled: true,
    },
    mediaLibrary: {
      enabled: true,
    },
    beta: {
      variants: {
        enabled: true,
      },
    },
  },
]) as WorkspaceOptions[]
