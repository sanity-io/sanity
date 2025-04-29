import {SanityApp} from '@sanity/sdk-react'
import {type ReactNode, useMemo} from 'react'

import {LoadingBlock} from '../components/loadingBlock/LoadingBlock'
import {useClient} from '../hooks/useClient'
import {useRenderingContext} from '../store/renderingContext/useRenderingContext'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'

export function SDKAppProvider({children}: {children: ReactNode}) {
  const client = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const renderContext = useRenderingContext()
  const dataset = client.config().dataset
  const projectId = client.config().projectId

  const isInDashboard = renderContext?.name === 'coreUi'
  const studioConfig = useMemo(() => {
    return {
      dataset: dataset,
      projectId: projectId,
      studioMode: {enabled: true},
    }
  }, [dataset, projectId])

  // TODO: do we want to avoid mounting the <SanityApp> sdk provider when not in dashboard?
  // if (!isInDashboard) {
  //   return children
  // }

  return (
    <SanityApp fallback={<LoadingBlock />} config={studioConfig}>
      {children}
    </SanityApp>
  )
}
