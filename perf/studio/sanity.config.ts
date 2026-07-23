/// <reference types="vite/client" />
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {useCallback} from 'react'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {defineConfig, defineDocumentFieldAction} from 'sanity'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {structureTool} from 'sanity/structure'

import {STUDIO_DATASET, STUDIO_PROJECT_ID} from '../tests/config/constants'
import {deepArray} from './schema/deepArray'
import {deepArrayReferences} from './schema/deepArrayReferences'
import {deepArrayString} from './schema/deepArrayString'
import {deepObject} from './schema/deepObject'
import {largeDocument} from './schema/largeDocument'
import {simple} from './schema/simple'

export default defineConfig({
  plugins: [structureTool({name: 'desk'})],
  title: 'Perf test Studio',
  name: 'default',
  projectId: STUDIO_PROJECT_ID,
  dataset: import.meta.env.SANITY_STUDIO_DATASET || STUDIO_DATASET,
  document: {
    // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
    unstable_fieldActions: (prev) => [
      ...prev,
      defineDocumentFieldAction({
        name: 'perf/test',
        // @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
        useAction({documentId, documentType, path}) {
          const handleAction = useCallback(() => {
            // oxlint-disable-next-line no-console
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
