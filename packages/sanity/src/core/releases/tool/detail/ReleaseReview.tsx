import {SearchIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {type DocumentValidationStatus} from './bundleDocumentsValidation'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {DocumentDiffContainer} from './review/DocumentDiffContainer'

const InputContainer = styled(Container)`
  margin: 0;
`
export function ReleaseReview({
  documents,
  release,
  documentsHistory,
  validation,
}: {
  documents: SanityDocument[]
  release: BundleDocument
  documentsHistory: Map<string, DocumentHistory>
  validation: Map<string, DocumentValidationStatus>
}) {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <Stack space={5}>
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
        {documents.map((document) => (
          <DocumentDiffContainer
            key={document._id}
            searchTerm={searchTerm}
            document={document}
            release={release}
            history={documentsHistory.get(document._id)}
            validation={validation.get(document._id)}
          />
        ))}
      </Stack>
    </Stack>
  )
}
