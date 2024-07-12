import {type SanityDocument} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../../store/bundles/types'
import {DocumentHeader} from './DocumentHeader'
import {DocumentRow} from './DocumentRow'
import {type DocumentSort} from './types'
import {type DocumentHistory} from './useReleaseHistory'

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

export function DocumentTable(props: {
  documents: SanityDocument[]
  documentsHistory: Map<string, DocumentHistory>
  release: BundleDocument
}) {
  const {documents, release, documentsHistory} = props
  // Filter will happen at the DocumentRow level because we don't have access here to the preview values.
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sort, setSort] = useState<DocumentSort>({property: '_updatedAt', order: 'desc'})

  const sortedDocuments = useMemo(() => {
    const sorted = [...documents]

    sorted.sort((a, b) => {
      const aDateString = a[sort.property]
      const bDateString = b[sort.property]

      const aDate = typeof aDateString === 'string' ? Date.parse(aDateString) : 0
      const bDate = typeof bDateString === 'string' ? Date.parse(bDateString) : 0

      if (sort.order === 'asc') {
        return aDate - bDate
      }

      return bDate - aDate
    })
    return sorted
  }, [documents, sort])

  return (
    <Stack space={1}>
      <DocumentHeader
        setSort={setSort}
        sort={sort}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <RowStack>
        {sortedDocuments.map((d) => (
          <DocumentRow
            searchTerm={searchTerm}
            document={d}
            key={d._id}
            release={release}
            history={documentsHistory.get(d._id)}
          />
        ))}
      </RowStack>
    </Stack>
  )
}
