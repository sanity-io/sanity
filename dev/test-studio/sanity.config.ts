import {assist} from '@sanity/assist'
import {colorInput} from '@sanity/color-input'
import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon} from '@sanity/icons'
import {koKRLocale} from '@sanity/locale-ko-kr'
import {nbNOLocale} from '@sanity/locale-nb-no'
import {nnNOLocale} from '@sanity/locale-nn-no'
import {ptPTLocale} from '@sanity/locale-pt-pt'
import {svSELocale} from '@sanity/locale-sv-se'
import {SanityMonogram} from '@sanity/logos'
import {debugSecrets} from '@sanity/preview-url-secret/sanity-plugin-debug-secrets'
import {tsdoc} from '@sanity/tsdoc/studio'
import {visionTool} from '@sanity/vision'
import {defineConfig, definePlugin, type WorkspaceOptions} from 'sanity'
import {defineDocuments, defineLocations, presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'
import {markdownSchema} from 'sanity-plugin-markdown'
import {media} from 'sanity-plugin-media'
import {muxInput} from 'sanity-plugin-mux-input'

import {imageAssetSource} from './assetSources'
import {
  Annotation,
  Block,
  CustomBadge,
  Field,
  formComponentsPlugin,
  InlineBlock,
  Input,
  Item,
  Preview,
} from './components/formComponents'
import {
  CustomLayout,
  CustomLogo,
  CustomNavbar,
  CustomToolMenu,
  studioComponentsPlugin,
} from './components/studioComponents'
import {GoogleLogo, TailwindLogo, VercelLogo} from './components/workspaceLogos'
import {resolveDocumentActions as documentActions} from './documentActions'
import {assistFieldActionGroup} from './fieldActions/assistFieldActionGroup'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {customInspector} from './inspectors/custom'
import {testStudioLocaleBundles} from './locales'
import {errorReportingTestPlugin} from './plugins/error-reporting-test'
import {autoCloseBrackets} from './plugins/input/auto-close-brackets-plugin'
import {wave} from './plugins/input/wave-plugin'
import {languageFilter} from './plugins/language-filter'
import {routerDebugTool} from './plugins/router-debug'
import {theme as tailwindTheme} from './sanity.theme.mjs'
import {createSchemaTypes} from './schema'
import {StegaDebugger} from './schema/debug/components/DebugStega'
import {CustomNavigator} from './schema/presentation/CustomNavigator'
import {types as presentationNextSanitySchemaTypes} from './schema/presentation/next-sanity'
import {types as presentationPreviewKitSchemaTypes} from './schema/presentation/preview-kit'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'
import {googleTheme} from './themes/google'
import {vercelTheme} from './themes/vercel'
import {workshopTool} from './workshop'

const localePlugins = [koKRLocale(), nbNOLocale(), nnNOLocale(), ptPTLocale(), svSELocale()]

const sharedSettings = ({projectId}: {projectId: string}) => {
  return definePlugin({
    name: 'sharedSettings',
    schema: {
      types: createSchemaTypes(projectId),
      templates: resolveInitialValueTemplates,
    },
    form: {
      image: {
        assetSources: [imageAssetSource],
      },
      file: {
        assetSources: [imageAssetSource],
      },
    },

    i18n: {
      bundles: testStudioLocaleBundles,
    },

    beta: {
      treeArrayEditing: {
        enabled: true,
      },
    },

    mediaLibrary: {
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
      workshopTool({
        collections: [
          {name: 'sanity', title: 'sanity'},
          {name: 'structure-tool', title: 'sanity/structure'},
          {name: 'form-builder', title: '@sanity/form-builder'},
        ],
      }),
      visionTool({
        // uncomment to test
        //defaultApiVersion: '2025-02-05',
      }),
      // eslint-disable-next-line camelcase
      muxInput({mp4_support: 'standard'}),
      imageHotspotArrayPlugin(),
      routerDebugTool(),
      errorReportingTestPlugin(),
      tsdoc(),
      media(),
      markdownSchema(),
      wave(),
      autoCloseBrackets(),
    ],
  })()
}

const defaultWorkspace = defineConfig({
  name: 'default',
  title: 'Test Studio',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  plugins: [sharedSettings({projectId: 'ppsg7ml5'})],

  onUncaughtError: (error, errorInfo) => {
    // eslint-disable-next-line no-console
    console.log(error)
    // eslint-disable-next-line no-console
    console.log(errorInfo)
  },
  basePath: '/test',
  icon: SanityMonogram,
  // eslint-disable-next-line camelcase
  __internal_serverDocumentActions: {
    enabled: true,
  },
  scheduledPublishing: {
    enabled: true,
    inputDateTimeFormat: 'MM/dd/yy h:mm a',
    showReleasesBanner: false,
  },
  tasks: {
    enabled: true,
  },
})

export default defineConfig([
  defaultWorkspace,
  {
    ...defaultWorkspace,
    name: 'us',
    title: 'Test Studio (US)',
    dataset: 'test-us',
    basePath: '/us',
  },
  {
    name: 'partialIndexing',
    title: 'Partial Indexing',
    projectId: 'ppsg7ml5',
    dataset: 'partial-indexing-2',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/partial-indexing',
    search: {
      unstable_partialIndexing: {
        enabled: true,
      },
    },
    scheduledPublishing: {
      enabled: false,
    },
    unstable_tasks: {
      enabled: false,
    },
  },
  {
    name: 'tsdoc',
    title: 'tsdoc',
    projectId: 'ppsg7ml5',
    dataset: 'tsdoc-2',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/tsdoc',
  },
  {
    name: 'playground',
    title: 'Test Studio (playground)',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/playground',
    beta: {
      eventsAPI: {
        releases: true,
      },
    },
    search: {
      strategy: 'groq2024',
    },
  },
  {
    name: 'listener-events',
    title: 'Listener events debug',
    subtitle: 'Listener events debugging',
    projectId: 'ppsg7ml5',
    dataset: 'data-loss',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/listener-events',
  },
  {
    name: 'playground-partial-indexing',
    title: 'Test Studio (playground-partial-indexing)',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground-partial-indexing',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/playground-partial-indexing',
  },
  {
    name: 'staging',
    title: 'Staging',
    subtitle: 'Staging dataset',
    projectId: 'exx11uqh',
    dataset: 'playground',
    plugins: [sharedSettings({projectId: 'exx11uqh'})],
    basePath: '/staging',
    apiHost: 'https://api.sanity.work',
    auth: {
      loginMethod: 'token',
    },
    unstable_tasks: {
      enabled: true,
    },
  },
  {
    name: 'playground-staging',
    title: 'playground (Staging)',
    projectId: 'exx11uqh',
    dataset: 'playground',
    plugins: [sharedSettings({projectId: 'exx11uqh'})],
    basePath: '/playground-staging',
    apiHost: 'https://api.sanity.work',
    auth: {
      loginMethod: 'token',
    },
  },
  {
    name: 'custom-components',
    title: 'Test Studio',
    subtitle: 'Components API playground',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [
      sharedSettings({projectId: 'ppsg7ml5'}),
      studioComponentsPlugin(),
      formComponentsPlugin(),
    ],
    basePath: '/custom-components',
    onUncaughtError: (error, errorInfo) => {
      // eslint-disable-next-line no-console
      console.log(error)
      // eslint-disable-next-line no-console
      console.log(errorInfo)
    },
    form: {
      components: {
        input: Input,
        field: Field,
        item: Item,
        preview: Preview,
        block: Block,
        inlineBlock: InlineBlock,
        annotation: Annotation,
      },
    },
    studio: {
      components: {
        layout: CustomLayout,
        logo: CustomLogo,
        navbar: CustomNavbar,
        toolMenu: CustomToolMenu,
      },
    },
  },
  {
    name: 'google-theme',
    title: 'Google Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/google',
    theme: googleTheme,
    icon: GoogleLogo,
  },
  {
    name: 'vercel-theme',
    title: 'Vercel Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/vercel',
    theme: vercelTheme,
    icon: VercelLogo,
  },
  {
    name: 'tailwind-theme',
    title: 'Tailwind Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/tailwind',
    theme: tailwindTheme,
    icon: TailwindLogo,
  },
  {
    name: 'ai-assist',
    title: 'Sanity AI Assist',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'}), assist()],
    basePath: '/ai-assist',
  },
  {
    name: 'stega',
    title: 'Debug Stega Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings({projectId: 'ppsg7ml5'})],
    basePath: '/stega',
    form: {
      components: {
        input: StegaDebugger,
      },
    },
  },
  {
    // Based on https://github.com/sanity-io/preview-kit/blob/195a476e5791421c5c8aa16275bad79a67b6ac58/apps/studio/sanity.config.ts#L42-L120
    name: 'presentation-preview-kit',
    title: 'Presentation with preview-kit',
    basePath: '/presentation-preview-kit',
    announcements: {enabled: false},
    scheduledPublishing: {enabled: false},
    tasks: {enabled: false},
    releases: {enabled: true},
    projectId: 'pv8y60vp',
    dataset: 'production',
    schema: {types: presentationPreviewKitSchemaTypes},
    plugins: [
      structureTool(),
      presentationTool({
        allowOrigins: ({origin}) => ['https://preview-kit-*.sanity.dev', origin],
        previewUrl: {
          initial: 'https://preview-kit-next-app-router.sanity.dev',
          previewMode: ({origin, targetOrigin}) =>
            origin === targetOrigin
              ? false
              : {
                  enable: '/api/draft',
                },
        },
        resolve: {
          locations: {
            page: defineLocations({
              locations: [
                {title: 'App Router', href: 'https://preview-kit-next-app-router.sanity.dev/'},
                {title: 'Pages Router', href: 'https://preview-kit-next-pages-router.sanity.dev/'},
                {title: 'Remix', href: 'https://preview-kit-remix.sanity.dev/'},
              ],
            }),
          },
        },
        components: {
          unstable_navigator: {minWidth: 120, maxWidth: 240, component: CustomNavigator},
        },
      }),
      visionTool(),
    ],
  },
  {
    // Based on https://github.com/sanity-io/next-sanity/blob/1d451c5aa606eb471e8dc4ddcd7ebf6253ae8eec/apps/mvp/sanity.config.ts#L5-L29
    name: 'presentation-next-sanity',
    title: 'Presentation with next-sanity',
    basePath: '/presentation-next-sanity',
    projectId: 'pv8y60vp',
    dataset: 'production',
    schema: {types: presentationNextSanitySchemaTypes},
    plugins: [
      assist(),
      structureTool(),
      presentationTool({
        allowOrigins: ['https://*.sanity.dev'],
        previewUrl: {
          // Intentionally using sanity.build instead of sanity.dev, to test that it's able to recover from the server side domain redirect to sanity.dev
          initial: 'https://next.sanity.build',
          previewMode: {enable: '/api/draft-mode/enable'},
        },
      }),
      visionTool(),
    ],
  },
]) as WorkspaceOptions[]
