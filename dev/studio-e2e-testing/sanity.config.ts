import {colorInput} from '@sanity/color-input'
import {googleMapsInput} from '@sanity/google-maps-input'
import {BookIcon, PlayIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineConfig, type ReleaseActionComponent} from 'sanity'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {markdownSchema} from 'sanity-plugin-markdown'
import {media} from 'sanity-plugin-media'
import {muxInput} from 'sanity-plugin-mux-input'
import {imageAssetSource} from 'sanity-test-studio/assetSources'
import {resolveDocumentActions as documentActions} from 'sanity-test-studio/documentActions'
import {assistFieldActionGroup} from 'sanity-test-studio/fieldActions/assistFieldActionGroup'
import {resolveInitialValueTemplates} from 'sanity-test-studio/initialValueTemplates'
import {customInspector} from 'sanity-test-studio/inspectors/custom'
import {languageFilter} from 'sanity-test-studio/plugins/language-filter'
import {defaultDocumentNode, newDocumentOptions, structure} from 'sanity-test-studio/structure'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'

import {customComponents} from './components-api'
import {e2eI18nBundles} from './i18n/bundles'
import {schemaTypes} from './schemaTypes'

const TestReleaseAction: ReleaseActionComponent = (props) => {
  const {release, documents} = props

  return {
    label: `E2E Test Action: ${release.metadata.title}`,
    icon: PlayIcon,
    disabled: false,
    title: `Test action for release "${release.metadata.title}" with ${documents.length} documents`,
    onHandle: () => {
      console.warn(
        `E2E Test Release Action executed! releaseTitle: ${release.metadata.title}, releaseId: ${release._id}, documentCount: ${documents.length}, releaseState: ${release.state}`,
      )
    },
  }
}

const defaultConfig = defineConfig({
  name: 'default',
  title: 'studio-e2e-testing',

  projectId: process.env.SANITY_E2E_PROJECT_ID!,
  dataset: process.env.SANITY_E2E_DATASET!,

  schema: {
    types: schemaTypes,
    templates: resolveInitialValueTemplates,
  },
  form: {
    image: {
      assetSources: [imageAssetSource],
    },
  },

  i18n: {
    bundles: e2eI18nBundles,
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
        return [...prev, assistFieldActionGroup]
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
    presentationTool({
      name: 'presentation',
      title: 'Presentation',
      previewUrl: {
        origin: 'https://test-studio.sanity.dev',
        preview: '/preview/index.html',
      },
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
    colorInput(),
    visionTool({
      defaultApiVersion: '2022-08-08',
    }),
    // eslint-disable-next-line camelcase
    muxInput({mp4_support: 'standard'}),
    media(),
    markdownSchema(),
    internationalizedArray({
      languages: [
        {id: 'en', title: 'English'},
        {id: 'fr', title: 'French'},
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string'],
    }),
  ],
  announcements: {
    enabled: false,
  },
  releases: {
    enabled: true,
    actions: [TestReleaseAction],
  },
  create: {
    startInCreateEnabled: false,
  },
  mediaLibrary: {
    enabled: true,
  },
})

export default defineConfig([
  {
    ...defaultConfig,
    basePath: '/chromium',
    name: 'chromium',
    title: 'studio-e2e-testing-chromium',
    dataset: process.env.SANITY_E2E_DATASET_CHROMIUM || process.env.SANITY_E2E_DATASET!,
    apiHost: 'https://api.sanity.work',
  },
  {
    ...defaultConfig,
    basePath: '/firefox',
    name: 'firefox',
    title: 'studio-e2e-testing-firefox',
    dataset: process.env.SANITY_E2E_DATASET_FIREFOX || process.env.SANITY_E2E_DATASET!,
    apiHost: 'https://api.sanity.work',
  },
])
