//import {codeInput} from '@sanity/code-input'
import {BookIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {createConfig, createPlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {CustomMarkers} from './components/formBuilder/CustomMarkers'
import {Markers} from './components/formBuilder/Markers'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {languageFilter} from './plugins/language-filter'
import {schemaTypes} from './schema'
import {defaultDocumentNode, structure, newDocumentOptions} from './structure'
import {workshopTool} from './workshop'

const sharedSettings = createPlugin({
  name: 'sharedSettings',
  schema: {
    types: (prev, context) => {
      // eslint-disable-next-line no-console
      ;(context as any).observeAsyncContext.subscribe(console.log)
      return [...prev, ...schemaTypes]
    },
    templates: resolveInitialValueTemplates,
  },
  // navbar: {
  //   components: {
  //     ToolMenu: ToolMenu,
  //   },
  // },
  form: {
    // unstable: {
    //   CustomMarkers,
    //   Markers,
    // },
    image: {
      assetSources: [imageAssetSource],
    },
  },
  document: {
    actions: documentActions,
    newDocumentOptions,
  },
  plugins: [
    // codeInput(),
    deskTool({
      // TODO:
      // components: {
      //   LanguageFilter,
      // },
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
    logo: Branding,
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/test',
  },
  {
    name: 'playground',
    title: 'Test Studio (playground)',
    logo: Branding,
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/playground',
  },
])
