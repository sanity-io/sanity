import {useRouter} from 'sanity/router'

import {ReleasesUpsellProvider} from '../contexts/upsell/ReleasesUpsellProvider'
import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesToolInner() {
  const router = useRouter()

  const {releaseId} = router.state
  if (releaseId) return <ReleaseDetail />

  return <ReleasesOverview />
}

export function ReleasesTool() {
  return (
    <ReleasesUpsellProvider>
      <ReleasesToolInner />
    </ReleasesUpsellProvider>
  )
}
