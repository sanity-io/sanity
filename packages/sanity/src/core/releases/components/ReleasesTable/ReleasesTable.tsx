import {Card, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {type BundlesMetadata} from '../../tool/useBundlesMetadata'
import {ReleaseHeader, type ReleaseHeaderProps} from './ReleaseHeader'
import {ReleaseRow} from './ReleaseRow'

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

export interface TableBundle extends BundleDocument {
  documentsMetadata: BundlesMetadata
}

interface ReleasesTableProps extends Omit<ReleaseHeaderProps, 'searchDisabled'> {
  bundles: TableBundle[]
}

export function ReleasesTable({bundles, searchTerm, setSearchTerm}: ReleasesTableProps) {
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

    return bundles.map((bundle) => <ReleaseRow key={bundle.name} bundle={bundle} />)
  }, [bundles])

  return (
    <Stack as="table" space={1}>
      <ReleaseHeader
        searchDisabled={!searchTerm && !bundles.length}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
      <RowStack as="tbody">{tableContent}</RowStack>
    </Stack>
  )
}
