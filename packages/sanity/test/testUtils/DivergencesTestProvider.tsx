import {Schema} from '@sanity/schema'
import {type ObjectSchemaType, defineType} from '@sanity/types'
import {type ComponentType, type PropsWithChildren} from 'react'

import {DivergencesProvider} from '../../src/core/form/contexts/DivergencesProvider'
import {useFormState} from '../../src/core/form/store/useFormState'

export const DivergencesTestProvider: ComponentType<PropsWithChildren> = ({children}) => {
  const bookSchemaType = Schema.compile({
    types: [
      defineType({
        name: 'store',
        type: 'document',
        fields: [
          {
            name: 'address',
            title: 'Address',
            type: 'string',
          },
        ],
      }),
    ],
  })

  const schemaType = bookSchemaType.get('store') as ObjectSchemaType

  const formState = useFormState({
    schemaType,
    documentValue: {},
    comparisonValue: {},
    focusPath: [],
    collapsedPaths: undefined,
    collapsedFieldSets: undefined,
    fieldGroupState: undefined,
    openPath: [],
    presence: [],
    validation: [],
    perspective: 'published',
    hasUpstreamVersion: false,
  })!

  return (
    <DivergencesProvider
      formState={formState}
      subjectId="y"
      displayedId="y"
      schemaType={schemaType}
      upstreamEditState={{
        id: 'x',
        type: 'store',
        transactionSyncLock: null,
        draft: null,
        published: null,
        version: null,
        liveEdit: false,
        liveEditSchemaType: false,
        ready: true,
        release: undefined,
      }}
      editState={{
        id: 'x',
        type: 'store',
        transactionSyncLock: null,
        draft: null,
        published: null,
        version: null,
        liveEdit: false,
        liveEditSchemaType: false,
        ready: true,
        release: undefined,
      }}
    >
      {children}
    </DivergencesProvider>
  )
}
