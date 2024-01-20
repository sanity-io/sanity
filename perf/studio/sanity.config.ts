/// <reference types="vite/client" />
import {useCallback} from 'react'
import {defineConfig, defineDocumentFieldAction, type PluginOptions} from 'sanity'
import {structureTool} from 'sanity/structure'

import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../tests/config/constants'
import {deepArray} from './schema/deepArray'
import {deepArrayReferences} from './schema/deepArrayReferences'
import {deepArrayString} from './schema/deepArrayString'
import {deepObject} from './schema/deepObject'
import {largeDocument} from './schema/largeDocument'
import {simple} from './schema/simple'

export default defineConfig({
  plugins: [
    // For some reason we need the explicit type cast here or else the type checker will fail with
    // TS4082: Default export of the module has or is using private name 'PluginOptions'.
    structureTool({name: 'desk'}) as PluginOptions,
  ],
  title: 'Perf test Studio',
  name: 'default',
  projectId: STUDIO_PROJECT_ID,
  dataset: import.meta.env.SANITY_STUDIO_DATASET || STUDIO_DATASET,
  document: {
    unstable_fieldActions: (prev) => [
      ...prev,
      defineDocumentFieldAction({
        name: 'perf/test',
        useAction({documentId, documentType, path}) {
          const handleAction = useCallback(() => {
            // eslint-disable-next-line no-console
            console.log('test action', {documentId, documentType, path})
          }, [documentId, documentType, path])

          return {
            type: 'action',
            title: 'Test',
            onAction: handleAction,
          }
        },
      }),
    ],
  },
  schema: {
    types: [simple, deepObject, deepArray, deepArrayString, deepArrayReferences, largeDocument],
  },
})
