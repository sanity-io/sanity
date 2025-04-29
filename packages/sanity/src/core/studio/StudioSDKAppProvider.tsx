import {SanityApp} from '@sanity/sdk-react'
import {type ReactNode} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {useClient} from '../hooks/useClient'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

export function SDKAppProvider({children}: {children: ReactNode}) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  return (
    <SanityApp
      fallback={<LoadingBlock />}
      config={{
        dataset: client.config().dataset,
        projectId: client.config().projectId,
      }}
    >
      {children}
    </SanityApp>
  )
}
