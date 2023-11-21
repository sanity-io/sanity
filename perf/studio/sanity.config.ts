/// <reference types="vite/client" />
import {defineConfig, defineDocumentFieldAction, PluginOptions} from 'sanity'
import {deskTool} from 'sanity/desk'
import {useCallback} from 'react'
import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../config/constants'
import {simple} from './schema/simple'
import {deepObject} from './schema/deepObject'
import {deepArray} from './schema/deepArray'
import {deepArrayString} from './schema/deepArrayString'
import {deepArrayReferences} from './schema/deepArrayReferences'
import {largeDocument} from './schema/largeDocument'

export default defineConfig({
  plugins: [
    // For some reason we need the explicit type cast here or else the type checker will fail with
    // TS4082: Default export of the module has or is using private name 'PluginOptions'.
    deskTool() as PluginOptions,
  ],
  title: 'Perf test Studio',
  name: 'default',
  projectId: STUDIO_PROJECT_ID,
  dataset: import.meta.env.SANITY_STUDIO_DATASET || STUDIO_DATASET,
  document: {
    unstable_comments: {enabled: false},
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
