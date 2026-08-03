import {useMemo} from 'react'
import {map, startWith} from 'rxjs'

import {useDeferredObservableValue} from '../../util/useDeferredObservableValue'
import {useProjectStore} from '../datastores'

const INITIAL_STATE = {value: null, loading: true}

/**
 * @beta
 * Returns the organization ID for the current project.
 * */
export function useProjectOrganizationId(): {value: string | null; loading: boolean} {
  const projectStore = useProjectStore()

  const obs$ = useMemo(
    () =>
      projectStore.getOrganizationId().pipe(
        map((res) => {
          return {value: res, loading: false}
        }),
        startWith({value: null, loading: true}),
      ),
    [projectStore],
  )

  return useDeferredObservableValue(obs$, INITIAL_STATE)
}
