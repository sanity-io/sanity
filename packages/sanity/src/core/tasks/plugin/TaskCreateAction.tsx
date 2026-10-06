import {TaskIcon} from '@sanity/icons/Task'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef} from 'react'

import {type DocumentActionDescription} from '../../config/document/actions'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {useTasksMode} from '../context/enabled/useTasksMode'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {useTasks} from '../context/tasks/useTasks'
import {useTasksUpsell} from '../context/upsell/useTasksUpsell'
import {tasksLocaleNamespace} from '../i18n'

export function TaskCreateAction(): DocumentActionDescription | null {
  const {handleOpenTasks, setViewMode} = useTasksNavigation()
  const modePromise = useTasksMode()
  const {handleOpenDialog} = useTasksUpsell()
  const toast = useToast()
  const {t: tStudio} = useTranslation()

  // The task form targets whichever document is active when it opens, so the action only goes
  // through if that is still the document it was invoked on once the mode has answered, and
  // only while the pane it was invoked from is still mounted (an unmounted action would not see
  // the active document move on)
  const {activeDocument} = useTasks()
  const activeDocumentRef = useRef(activeDocument)
  useLayoutEffect(() => {
    activeDocumentRef.current = activeDocument
  }, [activeDocument])
  const mountedRef = useRef(false)
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // The mode is read when the action runs, so the document pane never suspends on it
  const handleCreateTaskFromDocument = useCallback(async () => {
    const invokedOn = activeDocumentRef.current?.documentId
    const mode = await modePromise
    if (!mountedRef.current || activeDocumentRef.current?.documentId !== invokedOn) return
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
  }, [handleOpenTasks, setViewMode, modePromise, handleOpenDialog, toast, tStudio])

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
