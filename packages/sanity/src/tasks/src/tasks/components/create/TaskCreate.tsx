import {uuid} from '@sanity/uuid'
import {useMemo} from 'react'
import {LoadingBlock, useCurrentUser, useWorkspace} from 'sanity'
import {useTasks} from 'sanity/tasks'

import {type TaskDocument} from '../../types'
import {TasksForm} from '../form/TasksForm'
import {getTargetValue} from '../form/utils'

interface TaskCreateProps {
  onCreate: () => void
}
export function TaskCreate(props: TaskCreateProps) {
  const {onCreate} = props
  const {activeDocument} = useTasks()
  const documentId = useMemo(() => uuid(), [])
  const currentUser = useCurrentUser()
  const {dataset, projectId} = useWorkspace()
  if (!currentUser) return <LoadingBlock showText title="Loading current user" />

  const initialValue: Partial<TaskDocument> = {
    _id: documentId,
    _type: 'tasks.task',
    authorId: currentUser.id,
    status: 'open',
    target: activeDocument
      ? getTargetValue({
          documentId: activeDocument.documentId,
          documentType: activeDocument.documentType,
          dataset,
          projectId,
        })
      : undefined,
  }

  return <TasksForm documentId={documentId} initialValue={initialValue} mode="create" />
}
