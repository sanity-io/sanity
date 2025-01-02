import {useRouter} from 'sanity/router'

import {ReleasesMetadataProvider} from '../contexts/ReleasesMetadataProvider'
import {ReleaseDetail} from './detail/ReleaseDetail'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {releaseId} = router.state
  if (releaseId) return <ReleaseDetail />

  return (
    <ReleasesMetadataProvider>
      <ReleasesOverview />
    </ReleasesMetadataProvider>
  )
}
