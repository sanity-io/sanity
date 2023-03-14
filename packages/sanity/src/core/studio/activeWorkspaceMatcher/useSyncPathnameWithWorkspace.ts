import {useMemo, useState} from 'react'
import {useSyncExternalStoreWithSelector} from 'use-sync-external-store/with-selector'
import type {WorkspacesContextValue} from '../workspaces'
import {RouterHistory} from '../router'
import {matchWorkspace, type MatchWorkspaceResult} from './matchWorkspace'
import {createCommonBasePathRegex} from './createCommonBasePathRegex'
import {useNormalizedWorkspaces} from './useNormalizedWorkspaces'

/**
 * Reads the `history` pathname and responds to changes, returns matching workspace
 *  @internal
 */
export function useSyncPathnameWithWorkspace(
  history: RouterHistory,
  _workspaces: WorkspacesContextValue
): MatchWorkspaceResult {
  // Workspaces changes infrequently, but router matching can fire a lot. And so there's value in memoizing the normalized
  // to avoid creating new arrays on every render.
  const workspaces = useNormalizedWorkspaces(_workspaces)
  // As with `workspaces` there's value in only create the recursive basePath regex if there's `workspaces` have at all changed
  const basePathRegex = useMemo(() => createCommonBasePathRegex(workspaces), [workspaces])
  // history.location is mutable, so we snapshot it with useState to preserve the original pathname
  const [serverSnapshot] = useState(() => history.location.pathname)

  // React will only re-subscribe if store.subscribe changes identity, so by memoizing the whole store
  // we ensure that if any of the dependencies used by store.selector changes, we'll re-subscribe.
  // If we don't, we risk hot reload seeing stale workspace configs as the user is editing them.
  const store = useMemo(() => {
    return {
      subscribe: (onStoreChange: () => void) => history.listen(onStoreChange),
      getSnapshot: () => history.location.pathname,
      getServerSnapshot: () => serverSnapshot,
      selector: (pathname: string) => matchWorkspace({basePathRegex, pathname, workspaces}),
      isEqual: (a: MatchWorkspaceResult, b: MatchWorkspaceResult) => {
        if (a.type !== b.type) return false
        switch (a.type) {
          case 'match':
            return a.workspace === (b as typeof a).workspace
          case 'redirect':
            return a.pathname === (b as typeof a).pathname
          case 'not-found':
            return true
          default:
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS thinks this will never happen, but the point of the error is if it somehow did
            throw new Error(`Unknown type: ${(a as any).type}`)
        }
      },
    }
  }, [basePathRegex, history, serverSnapshot, workspaces])

  return useSyncExternalStoreWithSelector<string, MatchWorkspaceResult>(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    store.selector,
    store.isEqual
  )
}
