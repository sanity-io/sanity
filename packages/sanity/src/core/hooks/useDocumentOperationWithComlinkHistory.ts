import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'

import {useRenderingContextStore} from '../store/_legacy/datastores'
import {type OperationsAPI} from '../store/_legacy/document/document-pair/operations/types'
import {useActiveWorkspace} from '../studio/activeWorkspaceMatcher/useActiveWorkspace'
import {getVersionId} from '../util/draftUtils'
import {useRecordDocumentHistoryEvent} from './useRecordDocumentHistoryEvent'

interface Options {
  api: OperationsAPI
  publishedDocId: string
  docTypeName: string
  version?: string
}

/**
 * Decorate operations API methods with Comlink history capture when relevant operations are executed.
 *
 * Event capture only occurs when Comlink is available.
 *
 * @internal
 */
export function useDocumentOperationWithComlinkHistory({
  api,
  publishedDocId,
  docTypeName,
  version,
}: Options): OperationsAPI {
  const {activeWorkspace} = useActiveWorkspace()

  const {recordEvent} = useRecordDocumentHistoryEvent({
    resourceType: 'studio',
    documentId: version ? getVersionId(publishedDocId, version) : publishedDocId,
    documentType: docTypeName,
    resourceId: [activeWorkspace.projectId, activeWorkspace.dataset].join('.'),
    schemaName: activeWorkspace.name,
  })

  const renderingContextStore = useRenderingContextStore()
  const capabilities = useObservable(renderingContextStore.capabilities)

  // Used to prevent redundant `edited` events being recorded.
  const [hasRecordedEdit, setHasRecordedEdit] = useState<boolean>(false)

  // Record history for only the first edit to occur, to avoid inundating Dashboard history.
  const preRecordPatch = useCallback<PreRecordEvent>(
    (next) => {
      if (hasRecordedEdit) {
        return
      }
      next()
      setHasRecordedEdit(true)
    },
    [hasRecordedEdit],
  )

  const comlinkContext = useMemo(
    () => ({
      hasComlink: capabilities?.comlink,
      recordEvent,
    }),
    [capabilities?.comlink, recordEvent],
  )

  const withComlinkDelete = useMemo(
    () =>
      withComlinkEvent({
        ...comlinkContext,
        operationName: 'delete',
        comlinkEventType: 'deleted',
      }),
    [comlinkContext],
  )

  const withComlinkDel = useMemo(
    () =>
      withComlinkEvent({
        ...comlinkContext,
        operationName: 'del',
        comlinkEventType: 'deleted',
      }),
    [comlinkContext],
  )

  const withComlinkPatch = useMemo(
    () =>
      withComlinkEvent({
        ...comlinkContext,
        operationName: 'patch',
        comlinkEventType: 'edited',
        preRecordEvent: preRecordPatch,
      }),
    [comlinkContext, preRecordPatch],
  )

  return withComlinkDelete(withComlinkDel(withComlinkPatch(api)))
}

type ComlinkEventType = Parameters<
  ReturnType<typeof useRecordDocumentHistoryEvent>['recordEvent']
>[0]

type ExecuteParameters<OperationName extends keyof OperationsAPI> = Parameters<
  OperationsAPI[OperationName]['execute']
>

type RecordEvent = ReturnType<typeof useRecordDocumentHistoryEvent>['recordEvent']

type PreRecordEvent = (next: () => void) => void

interface WithComlinkEventOptions<OperationName extends keyof OperationsAPI> {
  operationName: OperationName
  comlinkEventType: ComlinkEventType
  hasComlink?: boolean
  recordEvent: RecordEvent
  preRecordEvent?: PreRecordEvent
}

/**
 * Decorate the provided API method with Comlink history capture.
 */
function withComlinkEvent<OperationName extends keyof OperationsAPI>({
  operationName,
  comlinkEventType,
  hasComlink,
  recordEvent,
  preRecordEvent = (next) => next(),
}: WithComlinkEventOptions<OperationName>): (api: OperationsAPI) => OperationsAPI {
  return function (api) {
    if (!hasComlink) {
      return api
    }

    return {
      ...api,
      [operationName]: {
        ...api[operationName],
        execute: (...args: ExecuteParameters<OperationName>) => {
          const next = () => recordEvent(comlinkEventType)
          preRecordEvent(next)
          api[operationName].execute(...args)
        },
      },
    }
  }
}
