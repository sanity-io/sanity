import {TaskIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {type DocumentActionDescription, useTranslation} from 'sanity'

import {tasksLocaleNamespace} from '../i18n'
import {useTasksEnabled, useTasksNavigation} from '../src'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const {enabled} = useTasksEnabled()

  const handleCreateTaskFromDocument = useCallback(() => {
    handleOpenTasks()
    setViewMode({type: 'create'})
  }, [handleOpenTasks, setViewMode])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (!enabled) return null

  return {
    icon: TaskIcon,
    label: t('tasks.actions.create.text'),
    title: t('tasks.actions.create.text'),
    group: ['paneActions'],
    onHandle: handleCreateTaskFromDocument,
  }
}
