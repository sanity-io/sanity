import {addWeeks, isAfter, isBefore} from 'date-fns'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {of} from 'rxjs'
import {catchError, map, startWith} from 'rxjs/operators'
import {type SanityClient, useClient, useProjectId} from 'sanity'

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

const LOADING_STATE = {loading: true, error: false, status: undefined}
const EMPTY_STATE = {loading: false, error: false, status: 'none'}
const DECLINED_STATE = {loading: false, error: false, status: 'declined'}
const PENDING_STATE = {loading: false, error: false, status: 'pending'}
const EXPIRED_STATE = {loading: false, error: false, status: 'expired'}

/** @internal */
export const useRoleRequestsStatus = () => {
  const client = useClient({apiVersion: '2024-07-01'})
  const projectId = useProjectId()

  const checkRoleRequests$ = useMemo(() => {
    if (!client || !projectId) {
      return of(EMPTY_STATE)
    }

    return checkRoleRequests(client, projectId)
  }, [client, projectId])

  const {loading, error, status} = useObservable(checkRoleRequests$, LOADING_STATE)
  return {data: status, loading, error}
}

function checkRoleRequests(client: SanityClient, projectId: string) {
  return client.observable
    .request<AccessRequest[] | null>({
      url: '/access/requests/me',
      tag: 'use-role-requests-status',
    })
    .pipe(
      map((requests) => {
        if (!requests || requests.length === 0) {
          return EMPTY_STATE
        }

        // Filter requests for the specific project and where type is 'role'
        const projectRequests = requests.filter(
          (request) => request.resourceId === projectId && request.type === 'role',
        )

        const declinedRequest = projectRequests.find((request) => request.status === 'declined')
        if (
          declinedRequest &&
          isAfter(addWeeks(new Date(declinedRequest.createdAt), 2), new Date())
        ) {
          return DECLINED_STATE
        }

        const pendingRequest = projectRequests.find(
          (request) =>
            request.status === 'pending' &&
            isAfter(addWeeks(new Date(request.createdAt), 2), new Date()),
        )
        if (pendingRequest) {
          return PENDING_STATE
        }

        const oldPendingRequest = projectRequests.find(
          (request) =>
            request.status === 'pending' &&
            isBefore(addWeeks(new Date(request.createdAt), 2), new Date()),
        )

        return oldPendingRequest ? EXPIRED_STATE : EMPTY_STATE
      }),
      catchError((err) => {
        console.error('Failed to fetch access requests', err)
        return of({loading: false, error: true, status: undefined})
      }),
      startWith(LOADING_STATE), // Start with loading state
    )
}
