import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'
import {useRouter} from 'sanity/router'

export function ReleasesTool() {
  const router = useRouter()

  const {releaseId} = router.state as {releaseId?: string}
  if (releaseId) return <ReleaseDetail key={releaseId} />

  return <ReleasesOverview />
}
