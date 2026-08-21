import {PackageIcon} from '@sanity/icons/Package'
import {type Tool} from 'sanity'

import {ReleasesTool} from './ReleasesTool'

/** Release tags with npm state, links out, and attributed regressions — see ReleasesTool. */
export const releasesTool: Tool = {
  name: 'releases',
  title: 'Releases',
  icon: PackageIcon,
  component: ReleasesTool,
}
