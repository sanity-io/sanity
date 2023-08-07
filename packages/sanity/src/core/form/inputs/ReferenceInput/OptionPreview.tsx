/* eslint-disable max-nested-callbacks */
/* eslint-disable no-nested-ternary */

import React from 'react'
import {ReferenceSchemaType} from '@sanity/types'
import {Stack, Text, TextSkeleton} from '@sanity/ui'
import {Observable} from 'rxjs'
import {Alert} from '../../components/Alert'
import {RenderPreviewCallback} from '../../types'
import {ReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {ReferencePreview} from './ReferencePreview'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 */
export function OptionPreview(props: {
  id: string
  type: ReferenceSchemaType
  getReferenceInfo: (id: string) => Observable<ReferenceInfo>
  renderPreview: RenderPreviewCallback
}) {
  const {getReferenceInfo, id: documentId, renderPreview} = props
  const {isLoading, result: referenceInfo, error} = useReferenceInfo(documentId, getReferenceInfo)

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
        <Alert title="Failed to load referenced document">
          <Text muted size={1}>
            Error: {error.message}
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
        Insufficient permissions to view this document
      </Stack>
    )
  }

  const refType = props.type.to.find((toType) => toType.name === referenceInfo.type)

  if (!refType) {
    return (
      <Stack space={2} padding={1}>
        Search returned a type that's not valid for this reference: "${referenceInfo.type}"
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
