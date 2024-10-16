import {TaskIcon} from '@sanity/icons'
import {Badge, useMediaIndex} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {useTasks, useTasksNavigation} from '../context'
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
export function TasksFooterOpenTasks() {
  const {data, activeDocument} = useTasks()
  const {handleOpenTasks, setActiveTab} = useTasksNavigation()
  const mediaIndex = useMediaIndex()
  const pendingTasks = useMemo(
    () =>
      activeDocument?.documentId
        ? data.filter((item) => {
            return (
              item.target?.document._ref === activeDocument.documentId &&
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

  if (pendingTasks.length === 0) return null

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
