import {Stack} from '@sanity/ui'
import styled from 'styled-components'

import {type AtLeastOneBundle} from '../../types/bundle'
import {BundleHeader} from './BundleHeader'
import {BundleRow} from './BundleRow'

const RowStack = styled(Stack)({
  '& > *:not(:first-child)': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -1,
  },

  '& > *:not(:last-child)': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
})

type Props = {
  bundles: AtLeastOneBundle
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
