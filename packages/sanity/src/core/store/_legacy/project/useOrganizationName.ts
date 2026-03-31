import {useEffect, useState} from 'react'

import {useClient} from '../../../hooks'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../../../studioClient'

/**
 * Fetches the organization name for a given organization ID.
 *
 * @param orgId - The organization ID to look up. Pass `null` to skip the request.
 * @returns The organization name, or an empty string if not yet loaded or on error.
 *
 * @internal
 */
export function useOrganizationName(orgId: string | null): string {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (!orgId) return undefined

    const sub = client.observable
      .request<{name?: string}>({url: `/organizations/${orgId}`, tag: 'get-org-name'})
      .subscribe({
        next: (res) => setOrgName(res.name ?? ''),
        error: () => setOrgName(''),
      })

    return () => sub.unsubscribe()
  }, [client, orgId])

  return orgName
}
