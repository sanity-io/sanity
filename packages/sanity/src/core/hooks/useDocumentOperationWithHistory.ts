import {useMemo, useState} from 'react'
import {useSyncObservable} from 'react-rx'

import {useRenderingContextStore} from '../store/datastores'
import {type OperationsAPI} from '../store/document/document-pair/operations/types'
import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'
import {getVersionId} from '../util/draftUtils'
import {
  type DocumentHistoryEventType,
  useDocumentHistoryRecorder,
} from './useDocumentHistoryRecorder'

interface Options {
  api: OperationsAPI
  publishedDocId: string
  docTypeName: string
  version?: string
}

/**
 * @internal
 */
export function useDocumentOperationWithHistory({
  api,
  publishedDocId,
  docTypeName,
  version,
}: Options): OperationsAPI {
  const {activeWorkspace} = useActiveWorkspace()

  const {recordEvent} = useDocumentHistoryRecorder({
    resourceType: 'studio',
    documentId: version ? getVersionId(publishedDocId, version) : publishedDocId,
    documentType: docTypeName,
    resourceId: [activeWorkspace.projectId, activeWorkspace.dataset].join('.'),
    schemaName: activeWorkspace.name,
  })

  const renderingContextStore = useRenderingContextStore()
  // Synchronous, so operations are decorated from the mounting render on.
  const capabilities = useSyncObservable(
    renderingContextStore.capabilities,
    renderingContextStore.getCapabilities,
  )

  // Record history for only the first edit to occur, to avoid inundating Dashboard history.
  const [preRecordPatch] = useState<PreRecordEvent>(() => {
    // Used to prevent redundant `edited` events being recorded.
    let hasRecordedEdit = false
    return (next: () => void) => {
      if (hasRecordedEdit) {
        return
      }
      next()
      hasRecordedEdit = true
    }
  })

  const historyContext = useMemo(
    () => ({
      hasHost: capabilities?.dashboard,
      recordEvent,
    }),
    [capabilities?.dashboard, recordEvent],
  )

  const withHistoryDelete = useMemo(
    () =>
      withHistoryEvent({
        ...historyContext,
        operationName: 'delete',
        eventType: 'deleted',
      }),
    [historyContext],
  )

  const withHistoryDel = useMemo(
    () =>
      withHistoryEvent({
        ...historyContext,
        operationName: 'del',
        eventType: 'deleted',
      }),
    [historyContext],
  )

  const withHistoryPatch = useMemo(
    () =>
      withHistoryEvent({
        ...historyContext,
        operationName: 'patch',
        eventType: 'edited',
        preRecordEvent: preRecordPatch,
      }),
    [historyContext, preRecordPatch],
  )

  return withHistoryDelete(withHistoryDel(withHistoryPatch(api)))
}

type ExecuteParameters<OperationName extends keyof OperationsAPI> = Parameters<
  OperationsAPI[OperationName]['execute']
>

type RecordEvent = ReturnType<typeof useDocumentHistoryRecorder>['recordEvent']

type PreRecordEvent = (next: () => void) => void

interface WithHistoryEventOptions<OperationName extends keyof OperationsAPI> {
  operationName: OperationName
  eventType: DocumentHistoryEventType
  hasHost?: boolean
  recordEvent: RecordEvent
  preRecordEvent?: PreRecordEvent
}

function withHistoryEvent<OperationName extends keyof OperationsAPI>({
  operationName,
  eventType,
  hasHost,
  recordEvent,
  preRecordEvent = (next) => next(),
}: WithHistoryEventOptions<OperationName>): (api: OperationsAPI) => OperationsAPI {
  return function (api) {
    if (!hasHost) {
      return api
    }

    return {
      ...api,
      [operationName]: {
        ...api[operationName],
        execute: (...args: ExecuteParameters<OperationName>) => {
          const next = () => recordEvent(eventType)
          preRecordEvent(next)
          api[operationName].execute(...args)
        },
      },
    }
  }
}
