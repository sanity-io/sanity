import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, defer, EMPTY, from, type Observable} from 'rxjs'

import {useStudioErrorHandler} from '../../studio/requestErrors/useStudioErrorHandler'
import {useProjectStore} from '../datastores'
import {type ProjectData} from './types'

/** @internal */
export function useProject(): {value: ProjectData | null} {
  const projectStore = useProjectStore()
  const errorHandler = useStudioErrorHandler()

  const project$ = useMemo(
    (): Observable<ProjectData> =>
      // `defer` keeps `attempt()` — which starts the request the moment it is
      // called — out of the render phase: the request first fires when the
      // observable is subscribed on commit. Paired with the `null` initial
      // value below, that keeps the request off the studio boot path while
      // this hook is mounted inside a hidden `<Activity>` (e.g. the closed
      // workspace menu popover, kept mounted from `@sanity/ui` v4).
      defer(() => from(errorHandler.attempt(() => projectStore.get(), {retryable: true}))).pipe(
        // Errors the channel does not claim (caller-domain 4xx, etc.) are
        // intentionally surfaced through the global unhandled path — the same
        // path rxjs uses for errors without an error handler — so they stay
        // visible to error monitoring instead of being rethrown into the
        // render by react-rx (which would tear down the subtree). The value
        // stays `null`, matching this hook's pre-react-rx behavior.
        catchError((err) => {
          setTimeout(() => {
            throw err
          })
          return EMPTY
        }),
      ),
    [errorHandler, projectStore],
  )

  return {value: useObservable(project$, null)}
}
