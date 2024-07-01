/* eslint-disable i18next/no-literal-string */
import {Card, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
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
  bundles: BundleDocument[]
}

export function BundlesTable({bundles}: Props) {
  const tableContent = useMemo(() => {
    if (bundles.length === 0) {
      return (
        <Card
          as="tr"
          border
          radius={3}
          display="flex"
          padding={4}
          style={{
            justifyContent: 'center',
          }}
        >
          <Text muted size={1}>
            No Releases
          </Text>
        </Card>
      )
    }

    return bundles.map((bundle) => <BundleRow key={bundle.name} bundle={bundle} />)
  }, [bundles])

  return (
    <Stack as="table" space={1}>
      <BundleHeader />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}
