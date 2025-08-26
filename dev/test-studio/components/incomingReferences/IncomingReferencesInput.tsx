import {useMemo} from 'react'
import {type ArrayOfPrimitivesInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type LinkedDocumentActions, type OnLinkDocumentCallback} from './types'

export function IncomingReferencesInput(
  props: ArrayOfPrimitivesInputProps & {
    onLinkDocument?: OnLinkDocumentCallback
    actions?: LinkedDocumentActions
  },
) {
  const {schemaType, onLinkDocument, actions} = props
  const types = useMemo(() => schemaType.of.map((type) => type.name), [schemaType])

  return <IncomingReferencesList types={types} onLinkDocument={onLinkDocument} actions={actions} />
}
