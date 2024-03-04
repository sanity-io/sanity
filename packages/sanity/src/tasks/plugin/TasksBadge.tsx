import {useMemo} from 'react'

import {useTasks} from '../src'

/**
 * Badge that shows how many pending tasks are assigned to the current document.
 * It's not the final stage, we want to introduce a button positioned left to the publish button for easier
 * discovery of the pending tasks.
 * @internal
 */
export function DocumentBadge() {
  const {data, activeDocument} = useTasks()
  const pendingTasks = useMemo(
    () =>
      data.filter((item) => {
        return item.target?.document._ref === activeDocument?.documentId && item.status === 'open'
      }),
    [activeDocument, data],
  )

  if (pendingTasks.length === 0) return null
  return <div>{`${pendingTasks.length} open tasks`}</div>
}
