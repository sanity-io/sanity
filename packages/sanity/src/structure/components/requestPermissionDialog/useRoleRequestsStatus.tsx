import {addWeeks, isAfter, isBefore} from 'date-fns'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {from, of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'
import {useClient, useProjectId} from 'sanity'

/** @internal */
export interface AccessRequest {
  id: string
  status: 'pending' | 'accepted' | 'declined'
  resourceId: string
  resourceType: 'project'
  createdAt: string
  updatedAt: string
  updatedByUserId: string
  requestedByUserId: string
  requestedRole: string
  type: 'access' | 'role'
  note: string
}

/** @internal */
export const useRoleRequestsStatus = () => {
  const client = useClient({apiVersion: '2024-07-01'})
  const projectId = useProjectId()

  const checkRoleRequests = useMemo(() => {
    if (!client || !projectId) {
      return of({loading: false, error: false, status: 'none'})
    }

    return from(
      client.request<AccessRequest[] | null>({
        url: `/access/requests/me`,
        tag: 'use-role-requests-status',
      }),
    ).pipe(
      map((requests) => {
        if (requests && requests.length) {
          // Filter requests for the specific project and where type is 'role'
          const projectRequests = requests.filter(
            (request) => request.resourceId === projectId && request.type === 'role',
          )

          const declinedRequest = projectRequests.find((request) => request.status === 'declined')
          if (
            declinedRequest &&
            isAfter(addWeeks(new Date(declinedRequest.createdAt), 2), new Date())
          ) {
            return {loading: false, error: false, status: 'declined'}
          }

          const pendingRequest = projectRequests.find(
            (request) =>
              request.status === 'pending' &&
              isAfter(addWeeks(new Date(request.createdAt), 2), new Date()),
          )
          if (pendingRequest) {
            return {loading: false, error: false, status: 'pending'}
          }

          const oldPendingRequest = projectRequests.find(
            (request) =>
              request.status === 'pending' &&
              isBefore(addWeeks(new Date(request.createdAt), 2), new Date()),
          )
          if (oldPendingRequest) {
            return {loading: false, error: false, status: 'expired'}
          }
        }
        return {loading: false, error: false, status: 'none'}
      }),
      catchError((err) => {
        console.error('Failed to fetch access requests', err)
        return of({loading: false, error: true, status: undefined})
      }),
      startWith({loading: true, error: false, status: undefined}), // Start with loading state
    )
  }, [client, projectId])

  // Use useObservable to subscribe to the checkRoleRequests observable
  const {loading, error, status} = useObservable(checkRoleRequests, {
    loading: true,
    error: false,
    status: undefined,
  })

  return {data: status, loading, error}
}
