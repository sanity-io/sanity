import {useMemo} from 'react'
import {type DocumentBadgeDescription} from 'sanity'

import {useTasks, useTasksEnabled} from '../src'

/**
 * Badge that shows how many pending tasks are assigned to the current document.
 * It's not the final stage, we want to introduce a button positioned left to the publish button for easier
 * discovery of the pending tasks.
 * @internal
 */
export function TasksBadge(): DocumentBadgeDescription | null {
  const {data, activeDocument} = useTasks()
  const {enabled} = useTasksEnabled()

  const pendingTasks = useMemo(
    () =>
      data.filter((item) => {
        return item.target?.document._ref === activeDocument?.documentId && item.status === 'open'
      }),
    [activeDocument, data],
  )

  if (!enabled) return null
  if (pendingTasks.length === 0) return null

  return {
    label: ` ${pendingTasks.length} open tasks`,
    color: 'primary' as const,
  }
}
