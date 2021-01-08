import React from 'react'
import {Observable} from 'rxjs'
import {Reference} from '@sanity/types'
import WithMaterializedDocument from './WithMaterializedDocument'

type Props = {
  reference?: Reference
  materialize: (string: string) => Observable<any>
  children: (arg: any) => null | React.ReactNode
}

function getRefId(reference?: Reference): string | undefined {
  return reference && reference._ref
}

export default function WithMaterializedReference(props: Props) {
  const {reference, children, ...rest} = props
  const documentId = getRefId(reference)
  return documentId ? (
    <WithMaterializedDocument {...rest} documentId={documentId}>
      {children}
    </WithMaterializedDocument>
  ) : null
}
