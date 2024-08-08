import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleSlug} = router.state
  if (bundleSlug) return <ReleaseDetail />

  return <ReleasesOverview />
}
