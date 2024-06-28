import {Stack} from '@sanity/ui'

import {type Version} from '../../../versions/types'
import {BundleHeader} from './BundleHeader'
import {BundleRow} from './BundleRow'
import {RowStack} from './RowStack'

type Props = {
  bundles: Version[]
}

export function BundlesTable({bundles}: Props) {
  return (
    <Stack as="table" space={1}>
      <BundleHeader />
      <RowStack as="tbody">
        {bundles.map((bundle) => (
          <BundleRow key={bundle.name} bundle={bundle} />
        ))}
      </RowStack>
    </Stack>
  )
}
