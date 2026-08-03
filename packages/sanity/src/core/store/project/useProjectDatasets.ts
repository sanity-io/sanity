import {useMemo} from 'react'

import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
import {useProjectStore} from '../datastores'
import {type ProjectDatasetData} from './types'

/** @internal */
export function useProjectDatasets(): {value: ProjectDatasetData[] | null} {
  const projectStore = useProjectStore()

  const project$ = useMemo(() => projectStore.getDatasets(), [projectStore])
  const value = useDeferredObservableValue(project$, null)

  return {value}
}
