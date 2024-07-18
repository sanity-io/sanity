import {useRouter} from 'sanity/router'

import {ReleaseDetail} from './detail/ReleaseDetail'
import {MigrateBundlesSlug} from './Migrate'
import {ReleasesOverview} from './overview/ReleasesOverview'

export function ReleasesTool() {
  const router = useRouter()

  const {bundleSlug} = router.state
  // TODO: Remove this after merging the PR and running the migration script
  if (bundleSlug === 'migrate') return <MigrateBundlesSlug />
  if (bundleSlug) return <ReleaseDetail />

  return <ReleasesOverview />
}
