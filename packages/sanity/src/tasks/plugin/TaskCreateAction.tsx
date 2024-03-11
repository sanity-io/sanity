import {useCallback} from 'react'
import {type DocumentActionDescription} from 'sanity'

import {useTasksNavigation} from '../src'
import {TaskIcon} from '../src/tasks/components/TaskIcon'

export function TaskCreateAction(): DocumentActionDescription {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()

  const handleCreateTaskFromDocument = useCallback(() => {
    handleOpenTasks()
    setViewMode({type: 'create'})
  }, [handleOpenTasks, setViewMode])

  return {
    icon: TaskIcon,
    label: 'Create new task',
    title: 'Create new task',
    group: ['paneActions'],
    onHandle: handleCreateTaskFromDocument,
  }
}
