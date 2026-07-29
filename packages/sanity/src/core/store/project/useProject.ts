import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {from} from 'rxjs'

import {useStudioErrorHandler} from '../../studio/requestErrors/useStudioErrorHandler'
import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): {value: ProjectData | null} {
  const projectStore = useProjectStore()
  const errorHandler = useStudioErrorHandler()

  const project$ = useMemo(
    () => from(errorHandler.attempt(() => projectStore.get(), {retryable: true})),
    [errorHandler, projectStore],
  )
  const value = useObservable(project$, null)

  return {value}
}
