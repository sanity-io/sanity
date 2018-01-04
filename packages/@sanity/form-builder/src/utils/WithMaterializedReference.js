// @flow
import React from 'react'
import WithMaterializedDocument from './WithMaterializedDocument'
import type {Reference} from '../typedefs'
import type {Node} from 'react'
import {ObservableI} from '../typedefs/observable'

type Props = {
  reference: Reference,
  materialize: (string) => ObservableI<Object>,
  children: Object => null | Node
}

function getRefId(reference: ?Reference): ?string {
  return reference && reference._ref
}

export default function WithMaterializedReference(props: Props) {
  const {reference, ...rest} = props
  const documentId = getRefId(reference)
  return documentId ? <WithMaterializedDocument {...rest} documentId={documentId} /> : null
}
