import {useMemo} from 'react'

import {Button} from '../../ui-components'
import {useTasks} from '../src'

/**
 * Button that shows how many pending tasks are assigned to the current document.
 * Clicking it will open the task sidebar, showing the open tasks related to the document.
 *
 * TODO: just show the tasks related to the document
 *
 * @internal
 */
export function TasksFooterOpenButton() {
  const {data, activeDocument, toggleOpen} = useTasks()

  const pendingTasks = useMemo(
    () =>
      data.filter((item) => {
        return item.target?.document._ref === activeDocument?.documentId && item.status === 'open'
      }),
    [activeDocument, data],
  )

  if (pendingTasks.length === 0) return null

  return (
    <Button
      data-as="a"
      mode="bleed"
      tooltipProps={{content: 'Open tasks'}}
      text={`${pendingTasks.length} open tasks`}
      onClick={toggleOpen}
    />
  )
}
