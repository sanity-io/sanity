import {LoadingBlock, useCurrentUser, useWorkspace} from 'sanity'

import {useTasks} from '../../context'
import {type TaskDocument} from '../../types'
import {TasksForm} from '../form/TasksForm'
import {getTargetValue} from '../form/utils'

export function TaskCreate({selectedTask}: {selectedTask: string}) {
  const {activeDocument} = useTasks()

  const currentUser = useCurrentUser()
  const {dataset, projectId} = useWorkspace()
  if (!currentUser) return <LoadingBlock showText title="Loading current user" />

  const initialValue: Partial<TaskDocument> = {
    _id: selectedTask,
    _type: 'tasks.task',
    authorId: currentUser.id,
    status: 'open',
    subscribers: [currentUser.id],
    target: activeDocument
      ? getTargetValue({
          documentId: activeDocument.documentId,
          documentType: activeDocument.documentType,
          dataset,
          projectId,
        })
      : undefined,
  }

  return (
    <TasksForm
      documentId={selectedTask}
      initialValue={initialValue}
      mode="create"
      key={selectedTask}
    />
  )
}
