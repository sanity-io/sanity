import {type SanityClient} from '@sanity/client'
import {catchError, firstValueFrom, of} from 'rxjs'

import {getProjectGrants} from '../../store/project/projectStore'
import {type ProjectGrants} from '../../store/project/types'

const DEPLOY_STUDIO_PERMISSION = 'sanity.project'
const DEPLOY_STUDIO_GRANT = 'deployStudio'

/**
 * Returns whether the given project grants include the `deployStudio` grant.
 *
 * Writing the schema descriptor and live studio manifest to Content Lake both
 * require this grant, so it's used to gate those uploads and avoid wasteful
 * 403 Forbidden requests for users who lack the permission.
 *
 * @internal
 */
export function hasDeployStudioGrant(grants: ProjectGrants | null | undefined): boolean {
  const permission = grants?.[DEPLOY_STUDIO_PERMISSION]
  return !!permission?.some((p) => p.grants.some((g) => g.name === DEPLOY_STUDIO_GRANT))
}

/**
 * Resolves whether the current user is allowed to deploy the studio (i.e. write
 * the schema descriptor and manifest), based on the project grants.
 *
 * Reuses the shared, memoized project grants observable, so this does not issue
 * a duplicate `/grants` request when the studio also reads grants elsewhere
 * (e.g. the navbar). Resolves to `false` if grants can't be fetched, so a
 * transient error never triggers an upload that would 403.
 *
 * @internal
 */
export function fetchCanDeployStudio(client: SanityClient): Promise<boolean> {
  if (!client.config().projectId) return Promise.resolve(false)

  return firstValueFrom(
    getProjectGrants(client).pipe(catchError(() => of<ProjectGrants>({}))),
  ).then(hasDeployStudioGrant)
}
