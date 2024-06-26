import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineConfig, definePlugin} from 'sanity'
import {structureTool} from 'sanity/structure'
import {muxInput} from 'sanity-plugin-mux-input'
import {imageAssetSource} from 'sanity-test-studio/assetSources'
import {resolveDocumentActions as documentActions} from 'sanity-test-studio/documentActions'
import {assistFieldActionGroup} from 'sanity-test-studio/fieldActions/assistFieldActionGroup'
import {copyAction} from 'sanity-test-studio/fieldActions/copyAction'
import {pasteAction} from 'sanity-test-studio/fieldActions/pasteAction'
import {resolveInitialValueTemplates} from 'sanity-test-studio/initialValueTemplates'
import {customInspector} from 'sanity-test-studio/inspectors/custom'
import {languageFilter} from 'sanity-test-studio/plugins/language-filter'
import {presenceTool} from 'sanity-test-studio/plugins/presence'
import {defaultDocumentNode, newDocumentOptions, structure} from 'sanity-test-studio/structure'

import {customComponents} from './components-api'
import {schemaTypes} from './schemaTypes'

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
  },
  plugins: [
    customComponents(),
    structureTool({
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
  features: {
    beta: {
      treeArrayEditing: {
        enabled: true,
      },
    },
  },
})

export default defineConfig({
  name: 'default',
  title: 'studio-e2e-testing',

  projectId: process.env.SANITY_E2E_PROJECT_ID!,
  dataset: process.env.SANITY_E2E_DATASET!,

  plugins: [sharedSettings()],
  basePath: '/test',
  // eslint-disable-next-line camelcase
  __internal_serverDocumentActions: {
    enabled: true,
  },
})
