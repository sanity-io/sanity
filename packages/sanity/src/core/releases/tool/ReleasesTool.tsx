import {useRouter} from 'sanity/router'

import {BundleDetail} from './BundleDetail'
import BundlesOverview from './BundlesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleId} = router.state

  if (bundleId) return <BundleDetail />

  return <BundlesOverview />
}
