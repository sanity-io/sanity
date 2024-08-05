import {SearchIcon} from '@sanity/icons'
import {Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {DocumentDiffContainer} from './review/DocumentDiffContainer'
import {type DocumentInBundleResult} from './useBundleDocuments'

const InputContainer = styled(Container)`
  margin: 0;
`
export function ReleaseReview({
  documents,
  release,
  documentsHistory,
}: {
  documents: DocumentInBundleResult[]
  release: BundleDocument
  documentsHistory: Record<string, DocumentHistory>
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredList = useMemo(() => {
    return documents.filter(({previewValues, document}) => {
      const fallbackTitle = typeof document.title === 'string' ? document.title : 'Untitled'
      const title =
        typeof previewValues.values.title === 'string' ? previewValues.values.title : fallbackTitle
      return title.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [searchTerm, documents])

  return (
    <Stack space={5} paddingTop={6}>
      <Flex justify="space-between" align="center">
        <Text size={1} weight="semibold">
          Changes to published documents
        </Text>
        <InputContainer width={0}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            placeholder="Search documents"
            radius={3}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            onClear={() => setSearchTerm('')}
            clearButton={!!searchTerm}
          />
        </InputContainer>
      </Flex>
      <Stack space={[5, 6]}>
        {filteredList.map(({document, validation, previewValues}) => (
          <DocumentDiffContainer
            key={document._id}
            document={document}
            release={release}
            history={documentsHistory[document._id]}
            validation={validation}
            previewValues={previewValues}
          />
        ))}
      </Stack>
    </Stack>
  )
}
