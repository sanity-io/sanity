import {useCallback} from 'react'

import {type OperationsAPI} from '../../../lib'

type ExecuteParameters<OperationName extends keyof OperationsAPI> = Parameters<
  OperationsAPI[OperationName]['execute']
>

interface ExecuteFn {
  (...args: ExecuteParameters<keyof OperationsAPI>): void
}

// TODO: pass options for specific error
export function useOperationAPIWithErrorHandling(operationsAPI: OperationsAPI) {
  // catch errors thrown by execut function
  const executeWithErrorHandling = useCallback((execute: ExecuteFn): ExecuteFn => {
    return (...args) => {
      try {
        execute(...args)
      } catch (err) {
        // TODO: use error
        console.error('Operations API Error: ', err)
      }
    }
  }, [])

  const withErrorHandling = useCallback(
    (api: OperationsAPI): OperationsAPI => {
      for (const e in api) {
        if ('execute' in api[e as keyof typeof api]) {
          const event = api[e as keyof typeof api]
          event.execute = executeWithErrorHandling(event.execute as ExecuteFn)
        }
      }
      return api
    },
    [executeWithErrorHandling],
  )

  return withErrorHandling(operationsAPI)
}
