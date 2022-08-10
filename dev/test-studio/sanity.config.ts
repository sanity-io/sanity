//import {codeInput} from '@sanity/code-input'
import {BookIcon} from '@sanity/icons'
import {createConfig, createPlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {CustomMarkers} from './components/formBuilder/CustomMarkers'
import {Markers} from './components/formBuilder/Markers'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {schemaTypes} from './schema'
import {defaultDocumentNode, structure, newDocumentOptions} from './structure'
import {workshopTool} from './workshop'

const sharedSettings = createPlugin({
  name: 'sharedSettings',
  schema: {
    types: schemaTypes,
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
    workshopTool({
      collections: [
        {name: 'sanity', title: 'sanity'},
        {name: 'default-layout', title: '@sanity/default-layout'},
        {name: 'desk-tool', title: '@sanity/desk-tool'},
        {name: 'form-builder', title: '@sanity/form-builder'},
      ],
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
