import {useCallback, useMemo} from 'react'

import {Button} from '../../ui-components'
import {useTasks, useTasksEnabled, useTasksNavigation} from '../src'

/**
 * Button that shows how many pending tasks are assigned to the current document.
 * Clicking it will open the task sidebar, showing the open tasks related to the document.
 *
 * todo: just show the tab with tasks related to the document
 * @internal
 */
export function TasksFooterOpenTasks() {
  const {data, activeDocument} = useTasks()
  const {handleOpenTasks, setActiveTab} = useTasksNavigation()
  const {enabled} = useTasksEnabled()

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

  return (
    <Button
      mode="bleed"
      tooltipProps={{content: `Open ${pluralizedTask}`}}
      text={`${pendingTasks.length} open ${pluralizedTask}`}
      onClick={handleOnClick}
    />
  )
}
