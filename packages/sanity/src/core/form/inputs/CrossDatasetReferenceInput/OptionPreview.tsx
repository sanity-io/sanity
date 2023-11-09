import React from 'react'
import {Stack, Text, TextSkeleton} from '@sanity/ui'
import type {CrossDatasetReferenceSchemaType} from '@sanity/types'
import type {Observable} from 'rxjs'
import {useTranslation} from '../../../i18n'
import {Alert} from '../../components/Alert'
import type {CrossDatasetReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {CrossDatasetReferencePreview} from './CrossDatasetReferencePreview'
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
      <Stack space={2} padding={1}>
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack space={2} padding={1}>
        <Alert title={t('inputs.reference.error.failed-to-load-document-title')}>
          <Text muted size={1}>
            {error.message}
          </Text>
        </Alert>
      </Stack>
    )
  }

  if (!referenceInfo) {
    return null
  }

  if (referenceInfo.availability?.reason === 'PERMISSION_DENIED') {
    return (
      <Stack space={2} padding={1}>
        {t('inputs.reference.error.missing-read-permissions-description')}
      </Stack>
    )
  }

  const refType = props.referenceType.to.find((toEntry) => toEntry.type === referenceInfo.type)
  if (!refType) {
    return (
      <Stack space={2} padding={1}>
        {t('inputs.reference.error.invalid-search-result-type-title', {
          returnedType: referenceInfo.type,
        })}
      </Stack>
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
