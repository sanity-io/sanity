import {type SanityDocument} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {type Dispatch, type SetStateAction, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../../store/bundles/types'
import {DocumentHeader} from './DocumentHeader'
import {DocumentRow} from './DocumentRow'
import {type DocumentSort} from './types'

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
  release: BundleDocument
  setCollaborators: Dispatch<SetStateAction<string[]>>
}) {
  const {documents, release, setCollaborators} = props

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
      <DocumentHeader setSort={setSort} sort={sort} />

      <RowStack>
        {sortedDocuments.map((d) => (
          <DocumentRow
            document={d}
            key={d._id}
            release={release}
            setCollaborators={setCollaborators}
          />
        ))}
      </RowStack>
    </Stack>
  )
}
