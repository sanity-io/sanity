import {assist} from '@sanity/assist'
import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon} from '@sanity/icons'
import {koKRLocale} from '@sanity/locale-ko-kr'
import {nbNOLocale} from '@sanity/locale-nb-no'
import {nnNOLocale} from '@sanity/locale-nn-no'
import {ptPTLocale} from '@sanity/locale-pt-pt'
import {svSELocale} from '@sanity/locale-sv-se'
import {SanityMonogram} from '@sanity/logos'
import {presentationTool as pinnedPresentationTool} from '@sanity/presentation'
import {debugSecrets} from '@sanity/preview-url-secret/sanity-plugin-debug-secrets'
import {tsdoc} from '@sanity/tsdoc/studio'
import {visionTool} from '@sanity/vision'
import {type Config, defineConfig, definePlugin, type WorkspaceOptions} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
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
import {copyAction} from './fieldActions/copyAction'
import {pasteAction} from './fieldActions/pasteAction'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {customInspector} from './inspectors/custom'
import {testStudioLocaleBundles} from './locales'
import {languageFilter} from './plugins/language-filter'
import {presenceTool} from './plugins/presence'
import {routerDebugTool} from './plugins/router-debug'
import {theme as tailwindTheme} from './sanity.theme.mjs'
import {documentFiltersSchemaTypes, schemaTypes} from './schema'
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
  search: {
    unstable_enableNewSearch: true,
  },

  i18n: {
    bundles: testStudioLocaleBundles,
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
      if (['fieldActionsTest', 'stringsTest'].includes(ctx.documentType)) {
        return [...prev, assistFieldActionGroup, copyAction, pasteAction]
      }

      return prev
    },
    newDocumentOptions,

    unstable_comments: {
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
    presenceTool(),
    routerDebugTool(),
    tsdoc(),
  ],
})

const sharedDocumentFiltersSettings = definePlugin<{locale: string}>(({locale}) => ({
  name: 'sharedDocumentFiltersSettings',
  schema: {
    types: documentFiltersSchemaTypes,
  },
  document: {
    unstable_filters: (filters) => [...filters, `language == "${locale}"`],
  },
  plugins: [
    structureTool({
      structure: (S) => S.documentTypeList('plant'),
    }),
    visionTool({
      defaultApiVersion: '2022-08-08',
    }),
  ],
}))

export default defineConfig<Config>([
  {
    name: 'default',
    title: 'Test Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/test',
    icon: SanityMonogram,
    // unstable_serverActions: {
    //   enabled: true,
    // },
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
        title: 'Presentation (stable)',
        previewUrl: '/preview/index.html',
      }),
      pinnedPresentationTool({
        name: 'reproduction-presentation',
        title: 'Presentation (reproduction)',
        previewUrl: '/preview/index.html',
      }),
      assist(),
      sharedSettings(),
    ],
    basePath: '/presentation',
  },
  {
    name: 'document-filters-en-us',
    title: 'Document Filters (en-US)',
    basePath: '/document-filters-en-us',
    projectId: 'ppsg7ml5',
    dataset: 'document-filters',
    plugins: [sharedDocumentFiltersSettings({locale: 'en-US'})],
  },
  {
    name: 'document-filters-nb',
    title: 'Document Filters (nb)',
    basePath: '/document-filters-nb',
    projectId: 'ppsg7ml5',
    dataset: 'document-filters',
    plugins: [sharedDocumentFiltersSettings({locale: 'nb'})],
  },
  {
    name: 'document-filters-ja',
    title: 'Document Filters (ja)',
    basePath: '/document-filters-ja',
    projectId: 'ppsg7ml5',
    dataset: 'document-filters',
    plugins: [sharedDocumentFiltersSettings({locale: 'ja'})],
  },
  {
    name: 'document-filters-flowering-plants-en-us',
    title: 'Document Filters (flowering plants) (en-US)',
    basePath: '/document-filters-flowering-plants-en-us',
    projectId: 'ppsg7ml5',
    dataset: 'document-filters',
    plugins: [sharedDocumentFiltersSettings({locale: 'en-US'})],
    document: {
      unstable_filters: (filters) => [...filters, 'isFlowering'],
    },
  },
]) as WorkspaceOptions[]
