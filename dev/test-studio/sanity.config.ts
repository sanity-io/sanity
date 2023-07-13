import {BookIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineConfig, definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {muxInput} from 'sanity-plugin-mux-input'
import {assist} from '@sanity/assist'
import {googleMapsInput} from '@sanity/google-maps-input'
import {tsdoc} from '@sanity/tsdoc/studio'
import {theme as tailwindTheme} from './sanity.theme.mjs'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {languageFilter} from './plugins/language-filter'
import {schemaTypes} from './schema'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'
import {workshopTool} from './workshop'
import {presenceTool} from './plugins/presence'
import {
  CustomLayout,
  CustomLogo,
  CustomNavbar,
  CustomToolMenu,
  studioComponentsPlugin,
} from './components/studioComponents'
import {
  Annotation,
  Block,
  Field,
  formComponentsPlugin,
  InlineBlock,
  Input,
  Item,
  Preview,
} from './components/formComponents'
import {googleTheme} from './themes/google'
import {vercelTheme} from './themes/vercel'
import {GoogleLogo, TailwindLogo, VercelLogo} from './components/workspaceLogos'
import {copyAction} from './fieldActions/copyAction'
import {assistFieldActionGroup} from './fieldActions/assistFieldActionGroup'
import {customInspector} from './inspectors/custom'
import {pasteAction} from './fieldActions/pasteAction'
import {noNBLocale} from './plugins/locale-no-nb'
import {testStudioLocaleBundles} from './locales'

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
  studio: {
    components: {
      logo: Branding,
    },
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
  },
  plugins: [
    noNBLocale(),
    deskTool({
      icon: BookIcon,
      name: 'content',
      title: 'Content',
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
        {name: 'default-layout', title: '@sanity/default-layout'},
        {name: 'desk-tool', title: '@sanity/desk-tool'},
        {name: 'form-builder', title: '@sanity/form-builder'},
      ],
    }),
    visionTool({
      defaultApiVersion: '2022-08-08',
    }),
    // eslint-disable-next-line camelcase
    muxInput({mp4_support: 'standard'}),
    presenceTool(),
    tsdoc(),
  ],
})

export default defineConfig([
  {
    name: 'default',
    title: 'Test Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/test',
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
    title: 'Test Studio',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/playground',
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
])
