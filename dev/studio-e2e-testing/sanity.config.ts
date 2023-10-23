import {defineConfig, definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
import {BookIcon} from '@sanity/icons'
import {muxInput} from 'sanity-plugin-mux-input'
import {googleMapsInput} from '@sanity/google-maps-input'
import {imageAssetSource} from '../test-studio/assetSources'
import {resolveDocumentActions as documentActions} from '../test-studio/documentActions'
import {resolveInitialValueTemplates} from '../test-studio/initialValueTemplates'
import {languageFilter} from '../test-studio/plugins/language-filter'
import {defaultDocumentNode, newDocumentOptions, structure} from '../test-studio/structure'
import {presenceTool} from '../test-studio/plugins/presence'
import {copyAction} from '../test-studio/fieldActions/copyAction'
import {assistFieldActionGroup} from '../test-studio/fieldActions/assistFieldActionGroup'
import {commentAction} from '../test-studio/fieldActions/commentFieldAction'
import {customInspector} from '../test-studio/inspectors/custom'
import {pasteAction} from '../test-studio/fieldActions/pasteAction'
import {Branding} from './components/Branding'
import {schemaTypes} from './schemas'

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
        return [...prev, commentAction, assistFieldActionGroup, copyAction, pasteAction]
      }

      return prev
    },
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
    googleMapsInput({
      apiKey: 'AIzaSyDDO2FFi5wXaQdk88S1pQUa70bRtWuMhkI',
      defaultZoom: 11,
      defaultLocation: {
        lat: 40.7058254,
        lng: -74.1180863,
      },
    }),
    visionTool({
      defaultApiVersion: '2022-08-08',
    }),
    // eslint-disable-next-line camelcase
    muxInput({mp4_support: 'standard'}),
    presenceTool(),
  ],
})

export default defineConfig({
  name: 'default',
  title: 'studio-e2e-testing',

  projectId: process.env.SANITY_E2E_PROJECT_ID!,
  dataset: process.env.SANITY_E2E_DATASET!,

  plugins: [sharedSettings()],
  basePath: '/test',
})
