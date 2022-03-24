import React from 'react'
import {CrossDatasetReference, CrossDatasetReferenceSchemaType} from '@sanity/types'
import {Stack, Text, TextSkeleton} from '@sanity/ui'
import {Loadable} from './useReferenceInfo'
import {CrossDatasetReferenceInfo} from './types'
import {CrossDatasetReferencePreview} from './CrossDatasetReferencePreview'

export function PreviewReferenceValue(props: {
  value: CrossDatasetReference
  showStudioUrlIcon?: boolean
  hasStudioUrl?: boolean
  type: CrossDatasetReferenceSchemaType
  referenceInfo: Loadable<CrossDatasetReferenceInfo>
}) {
  const {value, type, showStudioUrlIcon, hasStudioUrl, referenceInfo} = props

  if (referenceInfo.isLoading || referenceInfo.error) {
    return (
      <Stack space={2} padding={1}>
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated={!referenceInfo.error} />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated={!referenceInfo.error} />
      </Stack>
    )
  }
  const showTypeLabel = type.to.length > 1

  const refTypeName = referenceInfo.result?.type
  const refType = type.to.find((toType) => toType.type === refTypeName)

  if (referenceInfo.result.availability?.available && !refType) {
    return (
      <Stack space={2} padding={2}>
        <Text as="p">
          The referenced document is of invalid type: ({refTypeName || 'unknown'})
          <pre>{JSON.stringify(value, null, 2)}</pre>
        </Text>
      </Stack>
    )
  }

  return (
    <CrossDatasetReferencePreview
      availability={referenceInfo.result.availability}
      hasStudioUrl={hasStudioUrl}
      showStudioUrlIcon={showStudioUrlIcon}
      preview={referenceInfo.result.preview}
      refType={refType}
      projectId={type.projectId}
      dataset={type.dataset}
      id={value._ref}
      showTypeLabel={showTypeLabel}
    />
  )
}
