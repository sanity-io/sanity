import {TaskIcon} from '@sanity/icons/Task'
import {Badge, useMediaIndex} from '@sanity/ui'
import {use, useCallback, useMemo} from 'react'
import {TasksModePromiseContext} from 'sanity/_singletons'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getTargetDocumentId} from '../components/form/utils'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {useTasks} from '../context/tasks/useTasks'
import {tasksLocaleNamespace} from '../i18n'
import {buttonContainer} from './TasksFooterOpenTasks.css'

/**
 * Button that shows how many pending tasks are assigned to the current document.
 * Clicking it will open the task sidebar, showing the open tasks related to the document.
 * @internal
 */
export default function TasksFooterOpenTasks() {
  // `DocumentStatusBarActions` lazy-loads this module and suspends it under the status bar's
  // own boundary. A failed feature check (`null`) is already excluded before this mounts; the
  // check here fails closed too, because the sidebar this button opens reads as unavailable.
  // Like `useTasks()`, the mode read also tolerates the tasks studio provider not being mounted.
  const modePromise = use(TasksModePromiseContext)
  const mode = modePromise ? use(modePromise) : null
  const {data, activeDocument} = useTasks()
  const {handleOpenTasks, setActiveTab} = useTasksNavigation()
  const mediaIndex = useMediaIndex()
  const pendingTasks = useMemo(
    () =>
      activeDocument?.documentId
        ? data.filter((item) => {
            return (
              getTargetDocumentId(item.target) === activeDocument.documentId &&
              item.status === 'open' &&
              item.createdByUser
            )
          })
        : [],
    [activeDocument, data],
  )
  const handleOnClick = useCallback(() => {
    handleOpenTasks()
    setActiveTab('document')
  }, [handleOpenTasks, setActiveTab])

  const {t} = useTranslation(tasksLocaleNamespace)

  if (mode === null || pendingTasks.length === 0) return null

  if (mediaIndex < 3) {
    return (
      <div className={buttonContainer}>
        <Button
          mode="bleed"
          icon={TaskIcon}
          size={'large'}
          onClick={handleOnClick}
          tooltipProps={{
            content: t('document.footer.open-tasks.placeholder', {
              count: pendingTasks.length,
            }),
          }}
        />
        <Badge data-testid="tasks-badge" tone="primary" fontSize={0}>
          {pendingTasks.length}
        </Badge>
      </div>
    )
  }
  return (
    <Button
      mode="bleed"
      tooltipProps={{
        content: t('document.footer.open-tasks.placeholder', {
          count: pendingTasks.length,
        }),
      }}
      text={t('document.footer.open-tasks.text', {count: pendingTasks.length})}
      onClick={handleOnClick}
    />
  )
}
