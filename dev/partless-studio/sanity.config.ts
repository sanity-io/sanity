import {createConfig} from '@sanity/base'
import {codeInput} from '@sanity/code-input'
import {deskTool} from '@sanity/desk-tool'
import {BookIcon} from '@sanity/icons'
import {imageAssetSource} from './src/assetSources'
import {Branding} from './src/components/Branding'
import {CustomMarkers} from './src/components/formBuilder/CustomMarkers'
import {LanguageFilter} from './src/components/deskTool/LanguageFilter'
import {Markers} from './src/components/formBuilder/Markers'
import {resolveDocumentActions} from './src/documentActions'
import {scopes} from './src/workshop/scopes'
import {resolveInitialValueTemplates} from './src/initialValueTemplates'
import {schemaTypes} from './src/schema'
import {resolveStructureDocumentNode, resolveStructure} from './src/structure'
import {workshopTool} from './src/plugins/workshop'

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
      scopes,
    }),
  ],
  project: {
    logo: Branding,
    name: 'Partless Studio',
  },
})

export default sanityConfig
