import {Card, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {type BundlesMetadata} from '../../tool/useBundlesMetadata'
import {BundleHeader, type BundleHeaderProps} from './BundleHeader'
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

export type TableBundle = BundleDocument & BundlesMetadata

interface BundlesTableProps extends Omit<BundleHeaderProps, 'searchDisabled'> {
  bundles: TableBundle[]
}

export function BundlesTable({bundles, searchTerm, setSearchTerm}: BundlesTableProps) {
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
          <Text as="td" muted size={1}>
            No Releases
          </Text>
        </Card>
      )
    }

    return bundles.map((bundle) => <BundleRow key={bundle.name} bundle={bundle} />)
  }, [bundles])

  return (
    <Stack as="table" space={1}>
      <BundleHeader
        searchDisabled={!searchTerm && !bundles.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}
