import {TaskIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {type DocumentActionDescription} from 'sanity'

import {useTasksEnabled, useTasksNavigation} from '../src'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const {enabled} = useTasksEnabled()

  const handleCreateTaskFromDocument = useCallback(() => {
    handleOpenTasks()
    setViewMode({type: 'create'})
  }, [handleOpenTasks, setViewMode])

  if (!enabled) return null

  return {
    icon: TaskIcon,
    label: 'Create new task',
    title: 'Create new task',
    group: ['paneActions'],
    onHandle: handleCreateTaskFromDocument,
  }
}
