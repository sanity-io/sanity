import {useMemo} from 'react'
import {type ArrayOfPrimitivesInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type IncomingReferencesOptions} from './types'

export function IncomingReferencesInput(
  props: ArrayOfPrimitivesInputProps & IncomingReferencesOptions,
) {
  const {schemaType, onLinkDocument, actions, filterQuery} = props
  const types = useMemo(() => schemaType.of.map((type) => type.name), [schemaType])

  if (types.length > 1) {
    throw new Error('IncomingReferencesInput does not support multiple types in the `of` option')
  }

  return (
    <IncomingReferencesList
      types={types}
      onLinkDocument={onLinkDocument}
      actions={actions}
      filterQuery={filterQuery}
    />
  )
}
