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
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {imageHotspotArrayPlugin} from 'sanity-plugin-hotspot-array'
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
import {languageFilter} from './plugins/language-filter'
import {routerDebugTool} from './plugins/router-debug'
import {theme as tailwindTheme} from './sanity.theme.mjs'
import {schemaTypes} from './schema'
import {StegaDebugger} from './schema/debug/components/DebugStega'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'
import {googleTheme} from './themes/google'
import {vercelTheme} from './themes/vercel'
import {workshopTool} from './workshop'

const localePlugins = [koKRLocale(), nbNOLocale(), nnNOLocale(), ptPTLocale(), svSELocale()]

const sharedSettings = definePlugin({
  name: 'sharedSettings',
  schema: {
    types: schemaTypes,
    templates: resolveInitialValueTemplates,
  },
  form: {
    image: {
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
      defaultApiVersion: '2022-08-08',
    }),
    // eslint-disable-next-line camelcase
    muxInput({mp4_support: 'standard'}),
    imageHotspotArrayPlugin(),
    routerDebugTool(),
    errorReportingTestPlugin(),
    tsdoc(),
    media(),
  ],
})

const defaultWorkspace = {
  name: 'default',
  title: 'Test Studio',
  projectId: 'ppsg7ml5',
  dataset: 'test',
  plugins: [sharedSettings()],
  basePath: '/test',
  icon: SanityMonogram,
  // eslint-disable-next-line camelcase
  __internal_serverDocumentActions: {
    enabled: true,
  },
  scheduledPublishing: {
    enabled: true,
    inputDateTimeFormat: 'MM/dd/yy h:mm a',
  },
  tasks: {
    enabled: true,
  },
}

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
    plugins: [sharedSettings()],
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
    plugins: [sharedSettings()],
    basePath: '/tsdoc',
  },
  {
    name: 'playground',
    title: 'Test Studio (playground)',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/playground',
  },
  {
    name: 'playground-partial-indexing',
    title: 'Test Studio (playground-partial-indexing)',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground-partial-indexing',
    plugins: [sharedSettings()],
    basePath: '/playground-partial-indexing',
  },
  {
    name: 'staging',
    title: 'Staging',
    subtitle: 'Staging dataset',
    projectId: 'exx11uqh',
    dataset: 'playground',
    plugins: [sharedSettings()],
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
    name: 'custom-components',
    title: 'Test Studio',
    subtitle: 'Components API playground',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings(), studioComponentsPlugin(), formComponentsPlugin()],
    basePath: '/custom-components',
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
    plugins: [sharedSettings()],
    basePath: '/google',
    theme: googleTheme,
    icon: GoogleLogo,
  },
  {
    name: 'vercel-theme',
    title: 'Vercel Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/vercel',
    theme: vercelTheme,
    icon: VercelLogo,
  },
  {
    name: 'tailwind-theme',
    title: 'Tailwind Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/tailwind',
    theme: tailwindTheme,
    icon: TailwindLogo,
  },
  {
    name: 'ai-assist',
    title: 'Sanity AI Assist',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings(), assist()],
    basePath: '/ai-assist',
  },
  {
    name: 'stega',
    title: 'Debug Stega Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/stega',
    form: {
      components: {
        input: StegaDebugger,
      },
    },
  },
  {
    name: 'presentation',
    title: 'Presentation Studio',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [
      debugSecrets(),
      presentationTool({
        name: 'presentation',
        title: 'Presentation',
        previewUrl: {
          preview: '/preview/index.html',
        },
      }),
      assist(),
      sharedSettings(),
    ],
    basePath: '/presentation',
  },
]) as WorkspaceOptions[]
