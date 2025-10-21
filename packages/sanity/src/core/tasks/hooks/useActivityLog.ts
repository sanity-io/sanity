import {useCallback, useEffect, useState} from 'react'
import {useEffectEvent} from 'use-effect-event'

import {useClient} from '../../hooks/useClient'
import {getTransactionsLogs} from '../../store/translog/getTransactionsLogs'
import {getPublishedId} from '../../util/draftUtils'
import {type FieldChange, trackFieldChanges} from '../components/activity/helpers/parseTransactions'
import {API_VERSION} from '../constants/API_VERSION'
import {type TaskDocument} from '../types'

export function useActivityLog(task: TaskDocument): {
  changes: FieldChange[]
} {
  const [changes, setChanges] = useState<FieldChange[]>([])
  const client = useClient({apiVersion: API_VERSION})
  const publishedId = getPublishedId(task?._id ?? '')

  const fetchAndParse = useCallback(
    async (newestTaskDocument: TaskDocument) => {
      try {
        if (!publishedId) return

        const transactions = await getTransactionsLogs(client, publishedId, {
          tag: 'sanity.studio.tasks.history',
          effectFormat: 'mendoza',
          reverse: true,
        })

        const fieldsToTrack: (keyof Omit<TaskDocument, '_rev'>)[] = [
          'createdByUser',
          'title',
          'description',
          'dueBy',
          'assignedTo',
          'status',
          'target',
        ]

        const parsedChanges = await trackFieldChanges(
          newestTaskDocument,
          [...transactions],
          fieldsToTrack,
        )

        setChanges(parsedChanges)
      } catch (error) {
        console.error('Failed to fetch and parse activity log', error)
      }
    },
    [publishedId, client],
  )

  const handleFetchAndParse = useEffectEvent((_rev: string) => fetchAndParse(task))
  useEffect(() => {
    // Task is updated on every change, wait until the revision changes to update the activity log.
    handleFetchAndParse(task._rev)
  }, [task._rev])
  return {changes}
}
