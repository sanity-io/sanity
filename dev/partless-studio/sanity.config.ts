import {createConfig} from '@sanity/base'
import {codeInput} from '@sanity/code-input'
import {deskTool} from '@sanity/desk-tool'
import {BookIcon} from '@sanity/icons'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {CustomMarkers} from './components/formBuilder/CustomMarkers'
import {LanguageFilter} from './components/deskTool/LanguageFilter'
import {Markers} from './components/formBuilder/Markers'
import {resolveDocumentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {schemaTypes} from './schema'
import {resolveStructureDocumentNode, resolveStructure} from './structure'
import {workshopTool} from './workshop'

const sanityConfig = createConfig({
  sources: [
    {
      name: 'default',
      title: 'Default',
      projectId: 'ppsg7ml5',
      dataset: 'test',
      schemaTypes,
      initialValueTemplates: resolveInitialValueTemplates,
      structureDocumentNode: resolveStructureDocumentNode,
    },
  ],
  formBuilder: {
    components: {
      CustomMarkers,
      Markers,
    },
    image: {
      assetSources: [imageAssetSource],
    },
  },
  plugins: [
    codeInput(),
    deskTool({
      components: {
        LanguageFilter,
      },
      icon: BookIcon,
      name: 'content',
      documentActions: resolveDocumentActions,
      structure: resolveStructure,
      title: 'Content',
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
  project: {
    logo: Branding,
    name: 'Partless Studio',
  },
})

export default sanityConfig
