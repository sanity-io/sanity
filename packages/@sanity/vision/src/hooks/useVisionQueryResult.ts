import {Dispatch, SetStateAction, useCallback} from 'react'
import type {MutationEvent, RawQueryResponse} from '@sanity/client'
import {useVisionStore} from '../components/VisionStoreContext'

interface StartQueryExecutionOptions {
  type: 'query' | 'listen'
  shouldExecute?: boolean
  error?: Error | false
}

/**
 * @internal
 */
interface UseVisionQueryResult {
  startQueryExecution: (options: StartQueryExecutionOptions) => void
  handleQueryResult: (res: RawQueryResponse<unknown>, queryStart: number) => void
  handleQueryError: (e: Error) => void
  handleListenError: (e: Error) => void
  queryResult: unknown | undefined
  listenMutations: MutationEvent[]
  setListenMutations: Dispatch<SetStateAction<MutationEvent[]>>
}

/**
 * @internal
 */
export function useVisionQueryResult(): UseVisionQueryResult {
  const {
    query,
    setListenInProgress,
    setQueryTime,
    setE2ETime,
    queryResult,
    setQueryResult,
    listenMutations,
    setListenMutations,
    setError,
    setQueryInProgress,
  } = useVisionStore()

  const startQueryExecution = useCallback(
    ({type, shouldExecute, error}: StartQueryExecutionOptions) => {
      if (type === 'query') {
        setQueryInProgress(!error && Boolean(query.current))
        setListenInProgress(false)
      } else {
        setQueryInProgress(false)
        setListenInProgress(shouldExecute ?? true)
      }

      setError(error || undefined)
      setQueryTime(undefined)
      setE2ETime(undefined)
      setQueryResult(undefined)
      setListenMutations([])
    },
    [
      query,
      setE2ETime,
      setError,
      setListenInProgress,
      setListenMutations,
      setQueryInProgress,
      setQueryResult,
      setQueryTime,
    ],
  )

  const handleQueryResult = useCallback(
    (res: RawQueryResponse<unknown>, queryStart: number) => {
      setQueryTime(res.ms)
      setE2ETime(Date.now() - queryStart)
      setQueryResult(res.result)
      setQueryInProgress(false)
      setError(undefined)
    },
    [setE2ETime, setError, setQueryInProgress, setQueryResult, setQueryTime],
  )

  const handleQueryError = useCallback(
    (e: Error) => {
      setError(e)
      setQueryInProgress(false)
    },
    [setError, setQueryInProgress],
  )

  const handleListenError = useCallback(
    (e: Error) => {
      setError(e)
      setListenInProgress(false)
    },
    [setError, setListenInProgress],
  )

  return {
    startQueryExecution,
    handleQueryResult,
    handleQueryError,
    handleListenError,
    queryResult,
    listenMutations,
    setListenMutations,
  }
}
