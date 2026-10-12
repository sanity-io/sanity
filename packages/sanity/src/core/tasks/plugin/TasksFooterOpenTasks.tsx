import {TaskIcon} from '@sanity/icons/Task'
import {Badge, useMediaIndex} from '@sanity/ui'
import {use, useCallback, useMemo} from 'react'
import {TasksModePromiseContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components/button/Button'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {getTargetDocumentId} from '../components/form/utils'
import {useTasksNavigation} from '../context/navigation/useTasksNavigation'
import {useTasks} from '../context/tasks/useTasks'
import {tasksLocaleNamespace} from '../i18n'

const ButtonContainer = styled.div`
  position: relative;
  [data-ui='Badge'] {
    position: absolute;
    top: -2px;
    right: -2px;
  }
`

/**
 * Button that shows how many pending tasks are assigned to the current document.
 * Clicking it will open the task sidebar, showing the open tasks related to the document.
 * @internal
 */
export default function TasksFooterOpenTasks() {
  // Suspends under the plugin's own boundary around this action. A failed feature check (`null`)
  // fails closed here as well: the sidebar this button opens reads as unavailable, so the count
  // stays hidden, as it did when the tasks providers were not mounted for a failed check. The
  // action is handed to the document pane as a `ReactNode`, so like `useTasks()` it also copes
  // with the tasks studio provider not being mounted around it (the structure test harness)
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
      <ButtonContainer>
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
      </ButtonContainer>
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
