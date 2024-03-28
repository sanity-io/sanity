import {type ObjectInputProps} from 'sanity'

import {SetActiveDocument} from './structure/SetActiveDocument'

export function TasksDocumentInputLayout(props: ObjectInputProps) {
  const documentId = props.value?._id
  const documentType = props.value?._type

  return (
    <>
      <SetActiveDocument documentId={documentId} documentType={documentType} />
      {props.renderDefault(props)}
    </>
  )
}
