import React from 'react'
import {Stack, Text, TextSkeleton} from '@sanity/ui'
import type {ReferenceSchemaType} from '@sanity/types'
import type {Observable} from 'rxjs'
import {Alert} from '../../components/Alert'
import {useTranslation} from '../../../i18n'
import type {RenderPreviewCallback} from '../../types'
import type {ReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {ReferencePreview} from './ReferencePreview'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 *
 * @internal
 */
export function OptionPreview(props: {
  id: string
  type: ReferenceSchemaType
  getReferenceInfo: (id: string) => Observable<ReferenceInfo>
  renderPreview: RenderPreviewCallback
}) {
  const {getReferenceInfo, id: documentId, renderPreview} = props
  const {isLoading, result: referenceInfo, error} = useReferenceInfo(documentId, getReferenceInfo)
  const {t} = useTranslation()

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

  if (referenceInfo.availability.reason === 'PERMISSION_DENIED') {
    return (
      <Stack space={2} padding={1}>
        {t('inputs.reference.error.missing-read-permissions-description')}
      </Stack>
    )
  }

  const refType = props.type.to.find((toType) => toType.name === referenceInfo.type)

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
      <ReferencePreview
        id={referenceInfo.id}
        layout="default"
        preview={referenceInfo.preview}
        refType={refType}
        renderPreview={renderPreview}
        showTypeLabel={props.type.to.length > 1}
      />
    )
  )
}
