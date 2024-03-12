import {useCallback, useMemo} from 'react'

import {Button} from '../../ui-components'
import {useTasks, useTasksEnabled} from '../src'

/**
 * Button that shows how many pending tasks are assigned to the current document.
 * Clicking it will open the task sidebar, showing the open tasks related to the document.
 *
 * todo: just show the tab with tasks related to the document
 * @internal
 */
export function TasksFooterOpenTasks() {
  const {data, activeDocument, toggleOpen, isOpen} = useTasks()
  const {enabled} = useTasksEnabled()

  const pendingTasks = useMemo(
    () =>
      data.filter((item) => {
        return item.target?.document._ref === activeDocument?.documentId && item.status === 'open'
      }),
    [activeDocument, data],
  )

  const handleOnClick = useCallback(() => {
    if (isOpen) {
      return
    }
    toggleOpen()
  }, [isOpen, toggleOpen])

  if (pendingTasks.length === 0 || !enabled) return null

  return (
    <Button
      data-as="a"
      mode="bleed"
      tooltipProps={{content: 'Open tasks'}}
      text={`${pendingTasks.length} open tasks`}
      onClick={handleOnClick}
    />
  )
}
