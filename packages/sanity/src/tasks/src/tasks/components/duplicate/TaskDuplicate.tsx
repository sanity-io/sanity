import {LoadingBlock, useCurrentUser} from 'sanity'

import {useTasksNavigation} from '../../context'
import {type TaskDocument} from '../../types'
import {TasksForm} from '../form/TasksForm'

export function TaskDuplicate({selectedTask}: {selectedTask: string}) {
  const {state} = useTasksNavigation()
  const {duplicateTaskValues} = state
  const currentUser = useCurrentUser()
  if (!currentUser) return <LoadingBlock showText title="Loading current user" />

  const initialValue: Partial<TaskDocument> = {
    ...duplicateTaskValues,
    title: `${duplicateTaskValues?.title} (copy)`, // Set the new task title
    createdByUser: undefined, // Remove the createdByUser field
    _id: selectedTask, // Set the new task ID
    _type: 'tasks.task',
    authorId: currentUser.id, // Set the author ID
    status: 'open',
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
