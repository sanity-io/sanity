import {useMemo} from 'react'
import {type ArrayOfPrimitivesInputProps} from 'sanity'

import {IncomingReferencesList} from './IncomingReferencesList'
import {type OnLinkDocumentCallback, type OnUnlinkDocumentCallback} from './types'

export function IncomingReferencesInput(
  props: ArrayOfPrimitivesInputProps & {
    onLinkDocument?: OnLinkDocumentCallback
    onUnlinkDocument?: OnUnlinkDocumentCallback
  },
) {
  const {schemaType, onLinkDocument, onUnlinkDocument} = props
  const types = useMemo(() => schemaType.of.map((type) => type.name), [schemaType])

  return (
    <IncomingReferencesList
      types={types}
      onLinkDocument={onLinkDocument}
      onUnlinkDocument={onUnlinkDocument}
    />
  )
}
