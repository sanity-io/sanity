/* eslint-disable max-nested-callbacks */
import {type ObservableSanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {
  catchError,
  concat,
  concatMap,
  interval,
  type Observable,
  of,
  switchMap,
  takeWhile,
} from 'rxjs'

import {useClient} from '../../../../hooks/useClient'
import {type MediaLibrary} from '../types'

export type ProvisionErrorCode =
  | 'ERROR_NO_MEDIA_LIBRARIES_FOUND'
  | 'ERROR_NO_ORGANIZATION_FOUND'
  | 'ERROR_FAILED_TO_CREATE_MEDIA_LIBRARY'

export class ProvisionError extends Error {
  message: string
  error: string
  code: ProvisionErrorCode
  // eslint-disable-next-line unicorn/custom-error-definition
  constructor(message: string, error: string, code: ProvisionErrorCode) {
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
  status: 'provisioning' | 'active' | 'loading' | 'error'
  error?: ProvisionError
}

function getMediaLibrariesForOrganization(
  client: ObservableSanityClient,
  organizationId: string,
): Observable<MediaLibrary[]> {
  return client
    .request({
      uri: `/media-libraries?organizationId=${organizationId}`,
      method: 'GET',
    })
    .pipe(
      concatMap((data) => {
        if (data && Array.isArray(data.data)) {
          return of(data.data)
        }
        throw new ProvisionError(
          'No media libraries found',
          'No media libraries found',
          'ERROR_NO_MEDIA_LIBRARIES_FOUND',
        )
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

function requestMediaLibraryStatus(
  client: ObservableSanityClient,
  libraryId: string,
): Observable<EnsureMediaLibraryResponse> {
  return client
    .request({
      uri: `/media-libraries/${libraryId}`,
      method: 'GET',
    })
    .pipe(
      concatMap((data) => {
        if (data && data.id) {
          return of({
            id: data.id,
            organizationId: data.organizationId,
            status: data.status,
          } satisfies EnsureMediaLibraryResponse)
        }
        throw new ProvisionError(
          'Media library not found',
          'Media library not found',
          'ERROR_NO_MEDIA_LIBRARIES_FOUND',
        )
      }),
    )
}

function createMediaLibrary(
  client: ObservableSanityClient,
  organizationId: string,
): Observable<EnsureMediaLibraryResponse> {
  return client.request({
    uri: `/media-libraries`,
    method: 'POST',
    body: {organizationId},
  })
}

export function useEnsureMediaLibrary(projectId: string): EnsureMediaLibraryResponse {
  if (!projectId) {
    throw new Error('projectId is required to fetch organizationId')
  }
  const client = useClient({apiVersion: 'v2025-02-19'}).observable
  const observable = useMemo(
    () =>
      getOrganizationIdFromProjectId(client, projectId).pipe(
        switchMap((organizationId) => {
          return getMediaLibrariesForOrganization(client, organizationId).pipe(
            concatMap((mediaLibraryData) => {
              if (mediaLibraryData.length > 0) {
                return of({
                  id: mediaLibraryData[0].id,
                  organizationId,
                  status: 'active',
                } satisfies EnsureMediaLibraryResponse)
              }
              return createMediaLibrary(client, organizationId).pipe(
                // eslint-disable-next-line max-nested-callbacks
                concatMap((createdData) => {
                  if (createdData && createdData.id) {
                    return of({
                      id: createdData.id,
                      organizationId,
                      status: 'provisioning',
                    } satisfies EnsureMediaLibraryResponse)
                  }
                  throw new ProvisionError(
                    'Failed to create Media Library',
                    'Failed to create Media Library',
                    'ERROR_FAILED_TO_CREATE_MEDIA_LIBRARY',
                  )
                }),
                concatMap((libraryData) =>
                  concat(
                    of(libraryData), // Emit the initial response immediately
                    interval(1000).pipe(
                      concatMap(() => {
                        // Poll for the media library status
                        if (libraryData.id) {
                          return requestMediaLibraryStatus(client, libraryData.id).pipe(
                            concatMap((statusData) => {
                              return of(statusData)
                            }),
                          )
                        }
                        return of(libraryData)
                      }),
                      takeWhile((pData) => pData?.status === 'provisioning', true),
                    ),
                  ),
                ),
              )
            }),
          )
        }),
        catchError((err) => {
          if (err instanceof ProvisionError) {
            return of({
              id: undefined,
              organizationId: undefined,
              status: 'error' as const,
              error: err,
            } satisfies EnsureMediaLibraryResponse)
          }
          throw err
        }),
      ),
    [client, projectId],
  )

  return useObservable(observable, {status: 'loading'})
}
