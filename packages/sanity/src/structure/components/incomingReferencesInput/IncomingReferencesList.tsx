import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {LoadingBlock, useDocumentPreviewStore, useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {getIncomingReferences} from './getIncomingReferences'
import {IncomingReferencesType} from './IncomingReferencesType'
import {type IncomingReferencesOptions} from './types'

interface IncomingReferencesListProps extends IncomingReferencesOptions {
  types: string[]
  fieldName: string
}
export function IncomingReferencesList({
  types,
  onLinkDocument,
  actions,
  filterQuery,
  fieldName,
  creationAllowed,
}: IncomingReferencesListProps) {
  const {documentId, documentType} = useDocumentPane()
  const documentPreviewStore = useDocumentPreviewStore()
  const {t} = useTranslation(structureLocaleNamespace)
  const references$ = useMemo(
    () => getIncomingReferences({documentId, documentPreviewStore, types, filterQuery}),
    [documentId, documentPreviewStore, types, filterQuery],
  )

  const references = useObservable(references$, null)

  if (!types || types?.length === 0) {
    return (
      <Card border radius={2} padding={3} tone="critical">
        <Flex align="center" justify="center">
          <Text size={1} muted>
            {t('incoming-references-input.types-not-defined')}
          </Text>
        </Flex>
      </Card>
    )
  }

  if (!references || references.loading) {
    return <LoadingBlock showText title={'Loading documents'} />
  }
  return (
    <Stack space={3}>
      {types.map((type) => {
        const documents = references.list.find((list) => list.type === type)?.documents

        return (
          <IncomingReferencesType
            key={type}
            type={type}
            documents={documents}
            referenced={{id: documentId, type: documentType}}
            onLinkDocument={onLinkDocument}
            actions={actions}
            shouldRenderTitle={types.length > 1}
            fieldName={fieldName}
            creationAllowed={creationAllowed}
          />
        )
      })}
    </Stack>
  )
}
