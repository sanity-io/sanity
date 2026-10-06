import {TaskIcon} from '@sanity/icons/Task'
import {useCallback, useMemo} from 'react'

import {type DocumentActionDescription} from '../../config/document/actions'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksModePromise} from '../context/enabled/useTasksModePromise'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {useTasksUpsell} from '../context/upsell/useTasksUpsell'
import {tasksLocaleNamespace} from '../i18n'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const modePromise = useTasksModePromise()
  const {handleOpenDialog} = useTasksUpsell()

  // The mode is read when the action runs, so the document pane never suspends on it
  const handleCreateTaskFromDocument = useCallback(async () => {
    const mode = await modePromise
    if (mode === 'upsell') {
      handleOpenDialog('document_action')
    } else {
      handleOpenTasks()
      setViewMode({type: 'create'})
    }
  }, [handleOpenTasks, setViewMode, modePromise, handleOpenDialog])

  const {t} = useTranslation(tasksLocaleNamespace)

  return useMemo(
    () => ({
      icon: TaskIcon,
      label: t('actions.create.text'),
      title: t('actions.create.text'),
      group: ['paneActions'],
      onHandle: handleCreateTaskFromDocument,
    }),
    [handleCreateTaskFromDocument, t],
  )
}
