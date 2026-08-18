import {useMemo} from 'react'
import {useObservable} from 'react-rx'

import {useProjectStore} from '../datastores'
import {type ProjectDatasetData} from './types'

/** @internal */
export function useProjectDatasets(): {value: ProjectDatasetData[] | null} {
  const projectStore = useProjectStore()

  const project$ = useMemo(() => projectStore.getDatasets(), [projectStore])
  const value = useObservable(project$, null)

  return {value}
}
