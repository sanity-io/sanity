import {TaskIcon} from '@sanity/icons'
import {useCallback} from 'react'

import {type DocumentActionDescription} from '../../config'
import {useTranslation} from '../../i18n'
import {useTasksEnabled, useTasksNavigation, useTasksUpsell} from '../context'
import {tasksLocaleNamespace} from '../i18n'

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
