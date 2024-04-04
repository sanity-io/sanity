import {TaskIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {type DocumentActionDescription, useTranslation} from 'sanity'

import {tasksLocaleNamespace} from '../i18n'
import {useTasksEnabled, useTasksNavigation} from '../src'
import {useTasksUpsell} from '../src/tasks/context/upsell'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const {enabled, mode} = useTasksEnabled()
  const {handleOpenDialog} = useTasksUpsell()

  const handleCreateTaskFromDocument = useCallback(() => {
    if (mode === 'upsell') {
      handleOpenDialog('document_action')
    } else {
      handleOpenTasks()
      setViewMode({type: 'create'})
    }
  }, [handleOpenTasks, setViewMode, mode, handleOpenDialog])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (!enabled) return null

  return {
    icon: TaskIcon,
    label: t('actions.create.text'),
    title: t('actions.create.text'),
    group: ['paneActions'],
    onHandle: handleCreateTaskFromDocument,
  }
}
