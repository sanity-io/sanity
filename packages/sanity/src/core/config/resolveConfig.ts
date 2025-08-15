import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import {combineLatest, firstValueFrom, type Observable} from 'rxjs'
import {map} from 'rxjs/operators'

import {createMockAuthStore} from '../store'
import {prepareConfig} from './prepareConfig'
import {
  type Config,
  type SchemaPluginOptions,
  type SingleWorkspace,
  type Source,
  type Workspace,
} from './types'

/**
 * Fully resolves a configuration including subscribing to all sources and
 * workspaces from a config. Returns an `Observable` that waits till all sources
 * emit once before emitting an array of fully resolved sources and workspaces.
 *
 * @internal
 */
export function resolveConfig(config: Config): Observable<Workspace[]> {
  const {workspaces} = prepareConfig(config)

  return combineLatest(
    workspaces.flatMap((workspaceSummary) =>
      combineLatest(workspaceSummary.__internal.sources.map(({source}) => source)).pipe(
        map((sources): Workspace => {
          const rootSource = sources[0]
          return {
            ...rootSource,
            type: 'workspace',
            basePath: workspaceSummary.basePath,
            subtitle: workspaceSummary.subtitle,
            icon: workspaceSummary.icon,
            unstable_sources: sources,
            scheduledPublishing: workspaceSummary.scheduledPublishing,
          }
        }),
      ),
    ),
  )
}

/** @internal */
export type CreateWorkspaceFromConfigOptions =
  | SingleWorkspace
  | (SingleWorkspace & {
      currentUser: CurrentUser
      getClient: (options: {apiVersion: string}) => SanityClient
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
 * @internal
 */
export async function createWorkspaceFromConfig(
  options: CreateWorkspaceFromConfigOptions,
): Promise<Workspace> {
  const client = 'getClient' in options ? options.getClient({apiVersion: '2023-11-13'}) : undefined
  const [workspace] = await firstValueFrom(
    resolveConfig({
      ...options,
      ...(client &&
        'currentUser' in options && {
          auth: createMockAuthStore({...options, client}),
        }),
    }),
  )

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
 * @internal
 */
export async function createSourceFromConfig(
  options: CreateWorkspaceFromConfigOptions,
): Promise<Source> {
  const workspace = await createWorkspaceFromConfig(options)
  return workspace.unstable_sources[0]
}
