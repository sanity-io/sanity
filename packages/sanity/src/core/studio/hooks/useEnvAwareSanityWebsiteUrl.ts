import {useMemo} from 'react'

import {useWorkspace} from '../workspace'

export function useEnvAwareSanityWebsiteUrl() {
  const {getClient} = useWorkspace()
  return useMemo(() => {
    const apiHost = getClient({apiVersion: '2025-08-15'}).config().apiHost
    return apiHost.endsWith('.work') ? 'https://www.sanity.work' : 'https://www.sanity.io'
  }, [getClient])
}
