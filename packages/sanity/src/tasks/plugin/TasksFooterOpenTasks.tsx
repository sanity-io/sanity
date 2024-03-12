import {TaskIcon} from '@sanity/icons'
import {Badge, useMediaIndex} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import styled from 'styled-components'

import {Button} from '../../ui-components'
import {useTasks, useTasksEnabled, useTasksNavigation} from '../src'

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
  const {enabled} = useTasksEnabled()

  const mediaIndex = useMediaIndex()

  const pendingTasks = useMemo(
    () =>
      data.filter((item) => {
        return (
          item.target?.document._ref === activeDocument?.documentId &&
          item.status === 'open' &&
          item.createdByUser
        )
      }),
    [activeDocument, data],
  )

  const handleOnClick = useCallback(() => {
    handleOpenTasks()
    setActiveTab('document')
  }, [handleOpenTasks, setActiveTab])

  if (pendingTasks.length === 0 || !enabled) return null

  const pluralizedTask = `task${pendingTasks.length > 1 ? 's' : ''}`
  if (mediaIndex < 3) {
    return (
      <ButtonContainer>
        <Button
          mode="bleed"
          icon={TaskIcon}
          size={'large'}
          onClick={handleOnClick}
          tooltipProps={{
            content: `Open ${pluralizedTask}`,
          }}
        />
        <Badge tone="primary" fontSize={0}>
          {pendingTasks.length}
        </Badge>
      </ButtonContainer>
    )
  }
  return (
    <Button
      mode="bleed"
      tooltipProps={{content: `Open ${pluralizedTask}`}}
      text={`${pendingTasks.length} open ${pluralizedTask}`}
      onClick={handleOnClick}
    />
  )
}
