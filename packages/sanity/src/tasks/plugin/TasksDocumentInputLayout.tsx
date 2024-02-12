import {TasksEnabledProvider, TasksProvider, TasksSetupProvider} from '../src'
import {DocumentLayoutProps, FieldProps, InputProps, ObjectInputProps, getPublishedId} from 'sanity'
import {SetActiveDocument} from '../src/tasks/components/SetActiveDocument'
import {useMemo} from 'react'

export function TasksDocumentInputLayout(props: ObjectInputProps) {
  const documentId = props.value?._id

  return (
    <>
      <SetActiveDocument documentId={documentId} />
      {props.renderDefault(props)}
    </>
  )
}
