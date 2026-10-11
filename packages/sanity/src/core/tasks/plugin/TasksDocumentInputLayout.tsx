import {lazy, Suspense} from 'react'

import {type ObjectInputProps} from '../../form/types/inputProps'

const SetActiveDocument = lazy(() => import('./structure/SetActiveDocument'))

export function TasksDocumentInputLayout(props: ObjectInputProps) {
  const documentId = props.value?._id
  const documentType = props.value?._type

  return (
    <>
      <Suspense>
        <SetActiveDocument documentId={documentId} documentType={documentType} />
      </Suspense>
      {props.renderDefault(props)}
    </>
  )
}
