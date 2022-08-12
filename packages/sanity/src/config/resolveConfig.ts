import {combineLatest, Observable} from 'rxjs'
import {first, map} from 'rxjs/operators'
import {CurrentUser} from '@sanity/types'
import {SanityClient} from '@sanity/client'
import {createMockAuthStore} from '../datastores/authStore/createMockAuthStore'
import {Config, SingleWorkspace, Source, Workspace, SchemaPluginOptions} from './types'
import {prepareConfig} from './prepareConfig'

/**
 * Fully resolves a configuration including subscribing to all sources and
 * workspaces from a config. Returns an `Observable` that waits till all sources
 * emit once before emitting an array of fully resolved sources and workspaces.
 *
 * @alpha
 */
export function resolveConfig(config: Config): Observable<Workspace[]> {
  const {workspaces} = prepareConfig(config)

  return combineLatest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaces.flatMap((workspaceSummary) =>
      combineLatest(workspaceSummary.__internal.sources.map(({source}) => source)).pipe(
        map(
          (sources): Workspace => ({
            ...workspaceSummary,
            ...sources[0],
            unstable_sources: sources,
            type: 'workspace',
          })
        )
      )
    )
  )
}

type CreateWorkspaceFromConfigOptions =
  | SingleWorkspace
  | (SingleWorkspace & {
      currentUser: CurrentUser
      client: SanityClient
      schema?: SchemaPluginOptions
    })

/**
 * PRIMARILY FOR TESTING PURPOSES.
 *
 * This will create a fully resolved workspace from a config and optionally
 * allows a `client` and `currentUser` override. This exists primarily for
 * testing purposes. If you need to use a workspace, we recommend using the
 * `useWorkspace` hook to grab the fully resolved workspace from the
 * `StudioProvider`
 *
 * @alpha
 */
export async function createWorkspaceFromConfig(
  options: CreateWorkspaceFromConfigOptions
): Promise<Workspace> {
  const [workspace] = await resolveConfig({
    ...options,
    ...('client' in options &&
      'currentUser' in options && {
        auth: createMockAuthStore(options),
      }),
  })
    .pipe(first())
    .toPromise()

  return workspace
}

/**
 * PRIMARILY FOR TESTING PURPOSES.
 *
 * This will create a fully resolved source from a config and optionally
 * allows a `client` and `currentUser` override. This exists primarily for
 * testing purposes. If you need to use a source, we recommend using the
 * `useSource` hook to grab the fully resolved source from the `StudioProvider`
 *
 * @alpha
 */
export async function createSourceFromConfig(
  options: CreateWorkspaceFromConfigOptions
): Promise<Source> {
  const workspace = await createWorkspaceFromConfig(options)
  return workspace.unstable_sources[0]
}
