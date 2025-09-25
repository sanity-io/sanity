import {useMemo} from 'react'
import {type ArrayOfPrimitivesInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type IncomingReferencesOptions} from './types'

export function IncomingReferencesInput(
  props: ArrayOfPrimitivesInputProps & IncomingReferencesOptions,
) {
  const {schemaType, onLinkDocument, actions, filterQuery} = props
  const types = useMemo(() => schemaType.of.map((type) => type.name), [schemaType])

  return (
    <IncomingReferencesList
      types={types}
      onLinkDocument={onLinkDocument}
      actions={actions}
      filterQuery={filterQuery}
    />
  )
}
