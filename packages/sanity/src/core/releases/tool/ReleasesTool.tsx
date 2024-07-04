import {useRouter} from 'sanity/router'

import {BundleDetail} from './BundleDetail'
import BundlesOverview from './BundlesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleName} = router.state

  if (bundleName) return <BundleDetail />

  return <BundlesOverview />
}
