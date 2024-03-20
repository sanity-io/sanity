import {useCallback, useEffect, useState} from 'react'
import {getPublishedId, type TransactionLogEventWithEffects, useClient} from 'sanity'

import {getJsonStream} from '../../../../core/store/_legacy/history/history/getJsonStream'
import {type FieldChange, trackFieldChanges} from '../components/activity/helpers/parseTransactions'
import {API_VERSION} from '../constants/API_VERSION'
import {type TaskDocument} from '../types'

export function useActivityLog(task: TaskDocument): {
  changes: FieldChange[]
} {
  const [changes, setChanges] = useState<FieldChange[]>([])
  const client = useClient({apiVersion: API_VERSION})
  const {dataset, token} = client.config()

  const queryParams = `tag=sanity.studio.tasks.history&effectFormat=mendoza&excludeContent=true&includeIdentifiedDocumentsOnly=true&reverse=true`
  const transactionsUrl = client.getUrl(
    `/data/history/${dataset}/transactions/${getPublishedId(task._id)}?${queryParams}`,
  )

  const fetchAndParse = useCallback(
    async (newestTaskDocument: TaskDocument) => {
      try {
        const transactions: TransactionLogEventWithEffects[] = []

        const stream = await getJsonStream(transactionsUrl, token)
        const reader = stream.getReader()
        let result
        for (;;) {
          result = await reader.read()
          if (result.done) {
            break
          }
          if ('error' in result.value) {
            throw new Error(result.value.error.description || result.value.error.type)
          }
          transactions.push(result.value)
        }

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
    [transactionsUrl, token],
  )

  useEffect(() => {
    fetchAndParse(task)
    // Task is updated on every change, wait until the revision changes to update the activity log.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndParse, task._rev])
  return {changes}
}
