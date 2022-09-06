//import {codeInput} from '@sanity/code-input'
import {BookIcon, RobotIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {createConfig, createPlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
// import {CustomMarkers} from './components/formBuilder/CustomMarkers'
// import {Markers} from './components/formBuilder/Markers'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {
  customComponentsPlugin,
  LayoutConfigComponent,
  LogoConfigComponent,
  NavbarConfigComponent,
  ToolMenuConfigComponent,
} from './plugins/customComponents'
import {languageFilter} from './plugins/language-filter'
import {schemaTypes} from './schema'
import {defaultDocumentNode, structure, newDocumentOptions} from './structure'
import {workshopTool} from './workshop'

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
        Logo: Branding,
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
        Logo: Branding,
      },
    },
  },
  {
    name: 'custom-components',
    title: 'Test Studio (custom-components)',
    icon: RobotIcon,
    projectId: 'ppsg7ml5',
    dataset: 'test',
    basePath: '/custom-components',
    plugins: [sharedSettings(), customComponentsPlugin()],
    studio: {
      components: {
        Layout: LayoutConfigComponent,
        Logo: LogoConfigComponent,
        Navbar: NavbarConfigComponent,
        ToolMenu: ToolMenuConfigComponent,
      },
    },
  },
])
