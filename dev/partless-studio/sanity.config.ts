import {createConfig, deskTool} from '@sanity/base'
import {codeInput} from '@sanity/code-input'
import {BookIcon} from '@sanity/icons'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {CustomMarkers} from './components/formBuilder/CustomMarkers'
// import {LanguageFilter} from './components/deskTool/LanguageFilter'
import {Markers} from './components/formBuilder/Markers'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {schemaTypes} from './schema'
import {defaultDocumentNode, structure, newDocumentOptions} from './structure'
import {workshopTool} from './workshop'

export default createConfig({
  name: 'default',
  title: 'Partless Studio',
  logo: Branding,
  projectId: 'ppsg7ml5',
  dataset: 'test',
  schema: {
    types: schemaTypes,
    templates: resolveInitialValueTemplates,
  },
  formBuilder: {
    unstable: {
      CustomMarkers,
      Markers,
    },
    image: {
      assetSources: [imageAssetSource],
    },
  },
  document: {
    actions: documentActions,
    newDocumentOptions,
  },
  plugins: [
    codeInput(),
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
        {name: 'base', title: '@sanity/base'},
        {name: 'default-layout', title: '@sanity/default-layout'},
        {name: 'desk-tool', title: '@sanity/desk-tool'},
        {name: 'form-builder', title: '@sanity/form-builder'},
      ],
    }),
  ],
})
