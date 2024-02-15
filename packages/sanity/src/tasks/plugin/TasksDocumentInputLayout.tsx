import {type ObjectInputProps} from 'sanity'

import {SetActiveDocument} from '../src/tasks/components/SetActiveDocument'

export function TasksDocumentInputLayout(props: ObjectInputProps) {
  const documentId = props.value?._id

  return (
    <>
      <SetActiveDocument documentId={documentId} />
      {props.renderDefault(props)}
    </>
  )
}
