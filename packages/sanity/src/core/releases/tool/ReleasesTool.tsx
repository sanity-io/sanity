import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleId} = router.state
  if (bundleId) return <ReleaseDetail />

  return <ReleasesOverview />
}
