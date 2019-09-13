import React from 'react'
import WithMaterializedDocument from './WithMaterializedDocument'
import {Reference} from '../typedefs'
import {Observable} from 'rxjs'
type Props = {
  reference: Reference
  materialize: (arg0: string) => Observable<any>
  children: (arg: any) => null | React.ReactNode
}
function getRefId(reference: Reference | null): string | null {
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
