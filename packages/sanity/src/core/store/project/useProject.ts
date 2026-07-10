import {useEffect, useState} from 'react'
import {from} from 'rxjs'

import {useStudioErrorHandler} from '../../studio'
import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): {value: ProjectData | null} {
  const projectStore = useProjectStore()
  const errorHandler = useStudioErrorHandler()
  const [value, setValue] = useState<ProjectData | null>(null)

  useEffect(() => {
    const sub = from(errorHandler.attempt(() => projectStore.get(), {retryable: true})).subscribe(
      setValue,
    )
    return () => sub.unsubscribe()
  }, [errorHandler, projectStore])

  return {value}
}
