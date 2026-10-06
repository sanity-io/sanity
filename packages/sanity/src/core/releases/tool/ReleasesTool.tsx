import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export default function ReleasesTool() {
  const router = useRouter()

  const {releaseId} = router.state as {releaseId?: string}
  if (releaseId) return <ReleaseDetail key={releaseId} />

  return <ReleasesOverview />
}
