import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, defer, EMPTY, from, type Observable} from 'rxjs'

import {useStudioErrorHandler} from '../../studio/requestErrors/useStudioErrorHandler'
import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): ProjectData | null {
  const projectStore = useProjectStore()
  const errorHandler = useStudioErrorHandler()

  const project$ = useMemo(
    (): Observable<ProjectData> =>
      // `defer` is load-bearing: `attempt()` fires the request the moment it
      // is called. Deferring it to subscribe time — plus the `null` initial
      // value below — means no request while this hook renders hidden
      // (closed popovers stay mounted inside `<Activity>` since @sanity/ui v4).
      defer(() => from(errorHandler.attempt(() => projectStore.get(), {retryable: true}))).pipe(
        // Errors the channel does not claim (caller-domain 4xx, etc.) keep
        // this hook's old contract:
        // - rethrown out-of-band → still visible to error monitoring
        // - NOT rethrown into the render → no subtree teardown
        // - the value just stays `null`
        catchError((err) => {
          setTimeout(() => {
            throw err
          })
          return EMPTY
        }),
      ),
    [errorHandler, projectStore],
  )

  return useObservable(project$, null)
}
