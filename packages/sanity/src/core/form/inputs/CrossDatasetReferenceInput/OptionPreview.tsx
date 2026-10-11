import {type CrossDatasetReferenceSchemaType} from '@sanity/types'
import {Text, TextSkeleton} from '@sanity/ui'
import {type Observable} from 'rxjs'
import {Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Alert} from '../../components/Alert'
import {CrossDatasetReferencePreview} from './CrossDatasetReferencePreview'
import {type CrossDatasetReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {useProjectId} from './utils/useProjectId'

/**
 * Used to preview a referenced type
 * Takes as props the referenced document, the reference type and a hook to subscribe to
 * in order to listen for the reference info
 *
 * @internal
 */
export function OptionPreview(props: {
  document: {_id: string; _type: string}
  referenceType: CrossDatasetReferenceSchemaType
  getReferenceInfo: (doc: {_id: string; _type?: string}) => Observable<CrossDatasetReferenceInfo>
}) {
  const {
    isLoading,
    result: referenceInfo,
    error,
  } = useReferenceInfo(props.document, props.getReferenceInfo)
  const {t} = useTranslation()
  const projectId = useProjectId()

  if (isLoading) {
    return (
      <Flex gap={2} padding={1} flexDirection="column">
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex gap={2} padding={1} flexDirection="column">
        <Alert title={t('inputs.reference.error.failed-to-load-document-title')}>
          <Text muted size={1}>
            {error.message}
          </Text>
        </Alert>
      </Flex>
    )
  }

  if (!referenceInfo) {
    return null
  }

  if (referenceInfo.availability?.reason === 'PERMISSION_DENIED') {
    return (
      <Flex gap={2} padding={1} flexDirection="column">
        {t('inputs.reference.error.missing-read-permissions-description')}
      </Flex>
    )
  }

  const refType = props.referenceType.to.find((toEntry) => toEntry.type === referenceInfo.type)
  if (!refType) {
    return (
      <Flex gap={2} padding={1} flexDirection="column">
        {t('inputs.reference.error.invalid-search-result-type-title', {
          returnedType: referenceInfo.type,
        })}
      </Flex>
    )
  }
  return (
    referenceInfo &&
    refType && (
      <CrossDatasetReferencePreview
        id={referenceInfo.id}
        availability={referenceInfo.availability}
        preview={referenceInfo.preview}
        refType={refType}
        dataset={props.referenceType.dataset}
        projectId={projectId}
        showTypeLabel={props.referenceType.to.length > 1}
      />
    )
  )
}
