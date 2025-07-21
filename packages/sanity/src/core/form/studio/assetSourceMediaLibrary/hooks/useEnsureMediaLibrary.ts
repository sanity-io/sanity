import {type ObservableSanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  catchError,
  concatMap,
  defaultIfEmpty,
  EMPTY,
  from,
  map,
  type Observable,
  of,
  switchMap,
  take,
} from 'rxjs'

import {useClient} from '../../../../hooks/useClient'
import {type MediaLibrary} from '../types'

type ErrorCode = 'ERROR_NO_ORGANIZATION_FOUND'

export class ProvisionError extends Error {
  message: string
  error: string
  code: ErrorCode
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(message: string, error: string, code: ErrorCode) {
    // eslint-disable-next-line unicorn/custom-error-definition
    super(message)
    this.message = message
    this.error = error
    this.code = code
  }
}

type EnsureMediaLibraryResponse = {
  id?: string
  organizationId?: string
  status: 'active' | 'inactive' | 'loading' | 'error'
  error?: ProvisionError
}

function getMediaLibrariesForOrganization(
  client: ObservableSanityClient,
  organizationId: string,
): Observable<MediaLibrary> {
  return client
    .request<{data?: MediaLibrary[]}>({
      uri: `/media-libraries?organizationId=${organizationId}`,
      method: 'GET',
    })
    .pipe(
      switchMap((data) => {
        if (Array.isArray(data.data)) {
          return from(data.data)
        }
        return EMPTY
      }),
    )
}

function getOrganizationIdFromProjectId(
  client: ObservableSanityClient,
  projectId: string,
): Observable<string> {
  return client
    .request({
      uri: `/projects/${projectId}`,
      method: 'GET',
    })
    .pipe(
      concatMap(async (data) => {
        if (data.organizationId) {
          return data.organizationId
        }
        throw new ProvisionError(
          'Organization ID not found',
          'Organization ID not found',
          'ERROR_NO_ORGANIZATION_FOUND',
        )
      }),
    )
}

export function useEnsureMediaLibrary(projectId: string): EnsureMediaLibraryResponse {
  if (!projectId) {
    throw new Error('projectId is required to fetch organizationId')
  }
  const client = useClient({apiVersion: 'v2025-02-19'}).observable
  const observable = useMemo(
    () =>
      getOrganizationIdFromProjectId(client, projectId).pipe(
        switchMap((organizationId) =>
          getMediaLibrariesForOrganization(client, organizationId).pipe(
            map<MediaLibrary, EnsureMediaLibraryResponse>(({id}) => ({
              organizationId,
              status: 'active',
              id,
            })),
          ),
        ),
        take(1),
        defaultIfEmpty<EnsureMediaLibraryResponse, EnsureMediaLibraryResponse>({
          status: 'inactive',
        }),
        catchError<EnsureMediaLibraryResponse, Observable<EnsureMediaLibraryResponse>>((error) => {
          if (error instanceof ProvisionError) {
            return of({
              status: 'error',
              error: error,
            })
          }
          throw error
        }),
      ),
    [client, projectId],
  )

  return useObservable(observable, {status: 'loading'})
}
