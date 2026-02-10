import {Card, Flex, Stack, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from '../../panes/document/useDocumentPane'
import {CrossDatasetIncomingReferenceType} from './CrossDatasetIncomingReference/CrossDatasetIncomingReferenceType'
import {IncomingReferencesType} from './IncomingReferencesType'
import {type IncomingReferencesOptions, isCrossDatasetIncomingReference} from './types'

export function IncomingReferencesList({
  types,
  onLinkDocument,
  actions,
  filter,
  filterParams,
  name,
  creationAllowed,
}: IncomingReferencesOptions) {
  const {documentId, documentType} = useDocumentPane()
  const {t} = useTranslation(structureLocaleNamespace)

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

  return (
    <Stack space={3}>
      {types.map((type) => {
        if (isCrossDatasetIncomingReference(type)) {
          return (
            <CrossDatasetIncomingReferenceType
              key={`${type.type}-${type.dataset || ''}`}
              type={type}
              referenced={{id: documentId, type: documentType}}
              shouldRenderTitle={types.length > 1}
            />
          )
        }
        return (
          <IncomingReferencesType
            key={type.type}
            type={type}
            referenced={{id: documentId, type: documentType}}
            onLinkDocument={onLinkDocument}
            actions={actions}
            shouldRenderTitle={types.length > 1}
            fieldName={name}
            creationAllowed={creationAllowed}
            filter={filter}
            filterParams={filterParams}
          />
        )
      })}
    </Stack>
  )
}
