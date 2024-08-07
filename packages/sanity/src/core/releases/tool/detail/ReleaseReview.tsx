import {SearchIcon} from '@sanity/icons'
import {type SanityDocument} from '@sanity/types'
import {Container, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useState} from 'react'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {releasesLocaleNamespace} from '../../i18n'
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
  documentsHistory: Record<string, DocumentHistory>
  validation: Record<string, DocumentValidationStatus>
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <Stack space={5}>
      <Flex justify="space-between" align="center">
        <Text size={1} weight="semibold">
          {t('release.changes-published-docs.title')}
        </Text>
        <InputContainer width={0}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            placeholder={t('release.search-documents-placeholder')}
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
            history={documentsHistory[document._id]}
            validation={validation[document._id]}
          />
        ))}
      </Stack>
    </Stack>
  )
}
