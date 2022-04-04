import {from, combineLatest, Observable} from 'rxjs'
import {first, map} from 'rxjs/operators'
import {Source, Workspace} from './types'
import {resolveConfig} from './resolveConfig'
import {createConfig} from './createConfig'

type ParamsOf<T extends (...args: never[]) => unknown> = T extends (...args: infer TArgs) => unknown
  ? TArgs
  : never

export function getWorkspacesFromConfig(
  ...options: ParamsOf<typeof createConfig>
): Observable<Workspace[]> {
  const config = createConfig(...options)
  const {
    __internal: {workspaces},
  } = resolveConfig(config)

  return combineLatest(
    workspaces.map((partiallyResolvedWorkspace) =>
      combineLatest(partiallyResolvedWorkspace.sources).pipe(
        map(([rootSource, ...sources]) => {
          const workspace: Workspace = {
            ...partiallyResolvedWorkspace,
            ...rootSource,
            unstable_sources: [rootSource, ...sources],
          }

          return workspace
        })
      )
    )
  )
}

export async function getSourceFromConfig(
  ...options: ParamsOf<typeof createConfig>
): Promise<Source> {
  const [workspace] = await from(getWorkspacesFromConfig(...options))
    .pipe(first())
    .toPromise()
  const [source] = workspace.unstable_sources
  return source
}
