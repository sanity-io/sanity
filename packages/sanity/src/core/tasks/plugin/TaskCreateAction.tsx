import {TaskIcon} from '@sanity/icons/Task'
import {useToast} from '@sanity/ui/toast'
import {use, useCallback, useMemo} from 'react'

import {type DocumentActionDescription} from '../../config/document/actions'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksMode} from '../context/enabled/useTasksMode'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {useTasksUpsell} from '../context/upsell/useTasksUpsell'
import {tasksLocaleNamespace} from '../i18n'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  // Settled in place by the plugin's provider long before a document pane renders, so this reads
  // synchronously; a pane that does get here first waits under its own boundary
  const mode = use(useTasksMode())
  const {handleOpenDialog} = useTasksUpsell()
  const toast = useToast()
  const {t: tStudio} = useTranslation()

  const handleCreateTaskFromDocument = useCallback(() => {
    if (mode === null) {
      // The feature check failed, so whether the plan has tasks is unknown: fail closed, like a
      // failed check disables comments and scheduled publishing
      toast.push({
        status: 'error',
        title: tStudio('errors.unable-to-perform-action'),
        closable: true,
      })
      return
    }
    if (mode === 'upsell') {
      handleOpenDialog('document_action')
    } else {
      handleOpenTasks()
      setViewMode({type: 'create'})
    }
  }, [handleOpenTasks, setViewMode, mode, handleOpenDialog, toast, tStudio])

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
