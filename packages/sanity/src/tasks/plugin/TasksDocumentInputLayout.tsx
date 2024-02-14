import {SetActiveDocument} from '../src/tasks/components/SetActiveDocument'
import {ObjectInputProps} from 'sanity'

export function TasksDocumentInputLayout(props: ObjectInputProps) {
  const documentId = props.value?._id

  return (
    <>
      <SetActiveDocument documentId={documentId} />
      {props.renderDefault(props)}
    </>
  )
}
