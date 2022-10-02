import {BookIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {createConfig, createPlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
// import {muxInput} from 'sanity-plugin-mux-input'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {languageFilter} from './plugins/language-filter'
import {schemaTypes} from './schema'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'
import {workshopTool} from './workshop'
import {
  CustomLogo,
  CustomLayout,
  CustomNavbar,
  CustomToolMenu,
  studioComponentsPlugin,
} from './components/studioComponents'
import {Field, formComponentsPlugin, Input, Item, Preview} from './components/formComponents'

const sharedSettings = createPlugin({
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
  document: {
    actions: documentActions,
    newDocumentOptions,
  },
  plugins: [
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
    // muxInput({mp4_support: 'standard'}),
  ],
})

export default createConfig([
  {
    name: 'default',
    title: 'Test Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/test',
    studio: {
      components: {
        logo: Branding,
      },
    },
  },
  {
    name: 'playground',
    title: 'Test Studio (playground)',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/playground',
    studio: {
      components: {
        logo: Branding,
      },
    },
  },
  {
    name: 'custom-components',
    title: 'Test Studio (custom-components)',
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
])
