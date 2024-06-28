import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './ReleaseDetail'
import ReleasesOverview from './ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {releaseId} = router.state

  if (releaseId) return <ReleaseDetail />

  return <ReleasesOverview />
}
