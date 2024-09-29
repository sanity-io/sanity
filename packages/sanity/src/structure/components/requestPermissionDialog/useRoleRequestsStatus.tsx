import {addWeeks, isAfter, isBefore} from 'date-fns'
import {useEffect, useState} from 'react'
import {from, of} from 'rxjs'
import {catchError, map} from 'rxjs/operators'
import {useClient, useProjectId} from 'sanity'

import {type AccessRequest} from '../../../core/studio/screens'

export const useRoleRequestsStatus = () => {
  const client = useClient()
  const projectId = useProjectId()
  const [status, setStatus] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const checkRoleRequests$ = () => {
      setLoading(true)
      if (!client || !projectId) {
        return of()
      }

      return from(
        client.request<AccessRequest[] | null>({
          url: `/access/requests/me`,
        }),
      ).pipe(
        map((requests) => {
          if (requests && requests.length) {
            // Filter requests for the specific project and where type is 'role'
            const projectRequests = requests.filter(
              (request) => request.resourceId === projectId && request.type === 'role',
            )

            const declinedRequest = projectRequests.find((request) => request.status === 'declined')
            if (declinedRequest) {
              return 'denied'
            }

            const pendingRequest = projectRequests.find(
              (request) =>
                request.status === 'pending' &&
                isAfter(addWeeks(new Date(request.createdAt), 2), new Date()),
            )
            if (pendingRequest) {
              return 'pending'
            }

            const oldPendingRequest = projectRequests.find(
              (request) =>
                request.status === 'pending' &&
                isBefore(addWeeks(new Date(request.createdAt), 2), new Date()),
            )
            if (oldPendingRequest) {
              return 'expired'
            }
          }
          return 'none' // No pending requests found
        }),
        catchError((err) => {
          console.error(err)
          return of()
        }),
      )
    }

    const subscription = checkRoleRequests$().subscribe({
      next: (value) => {
        setLoading(false)
        setStatus(value)
      },
      error: (err) => {
        console.error(err)
        setError(err)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client, projectId])

  return {data: status, loading, error}
}
