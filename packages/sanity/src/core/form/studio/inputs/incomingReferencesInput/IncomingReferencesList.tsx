import {type IncomingReferencesOptions, isCrossDatasetIncomingReference} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {getPublishedId} from '../../../../util/draftUtils'
import {useFormValue} from '../../../contexts/FormValue'
import {CrossDatasetIncomingReferences} from './CrossDatasetIncomingReference/CrossDatasetIncomingReferences'
import {IncomingReferences} from './IncomingReferences'

interface IncomingReferencesListProps extends IncomingReferencesOptions {
  fieldName: string
}
export function IncomingReferencesList({
  types,
  onLinkDocument,
  actions,
  filter,
  filterParams,
  fieldName,
  creationAllowed,
}: IncomingReferencesListProps) {
  const documentId = useFormValue(['_id']) as string
  const documentType = useFormValue(['_type']) as string

  const {t} = useTranslation()

  if (!types || types?.length === 0) {
    return (
      <Card border radius={2} padding={3} tone="critical">
        <Flex align="center" justify="center">
          <Text size={1} muted>
            {t('incoming-references.input.types-not-defined')}
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
            <CrossDatasetIncomingReferences
              key={`${type.type}-${type.dataset || ''}`}
              type={type}
              referenced={{id: documentId, type: documentType}}
              shouldRenderTitle={types.length > 1}
            />
          )
        }
        return (
          <IncomingReferences
            key={type.type}
            type={type}
            referenced={{id: getPublishedId(documentId), type: documentType}}
            onLinkDocument={onLinkDocument}
            actions={actions}
            shouldRenderTitle={types.length > 1}
            fieldName={fieldName}
            creationAllowed={creationAllowed}
            filter={filter}
            filterParams={filterParams}
          />
        )
      })}
    </Stack>
  )
}
