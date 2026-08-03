import {useMemo} from 'react'
import {map, startWith} from 'rxjs'

import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
import {useProjectStore} from '../datastores'
import {type ProjectOrganizationData} from './types'

const INITIAL_STATE = {value: null, loading: true}

/**
 * @beta
 * Returns the organization data for the current project.
 * */
export function useProjectOrganizationData(): {
  value: ProjectOrganizationData | null
  loading: boolean
} {
  const projectStore = useProjectStore()

  const obs$ = useMemo(
    () =>
      projectStore.getOrganizationData().pipe(
        map((res) => {
          return {value: res, loading: false}
        }),
        startWith({value: null, loading: true}),
      ),
    [projectStore],
  )

  return useDeferredObservableValue(obs$, INITIAL_STATE)
}
