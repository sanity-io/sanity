/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React from 'react'
import {ReferenceSchemaType} from '@sanity/types'
import {Stack, TextSkeleton} from '@sanity/ui'
import {Observable} from 'rxjs'
import {Alert} from '../../components/Alert'
import {PreviewComponentType, ReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 * @param props
 * @constructor
 */
export function OptionPreview(props: {
  id: string
  type: ReferenceSchemaType
  getReferenceInfo: (id: string) => Observable<ReferenceInfo>
  previewComponent: PreviewComponentType
}) {
  const {previewComponent: PreviewComponent} = props
  const {isLoading, result: referenceInfo, error} = useReferenceInfo(
    props.id,
    props.getReferenceInfo
  )

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
        <Alert title="Failed to load referenced document">Error: {error.message}</Alert>
      </Stack>
    )
  }

  if (
    referenceInfo.draft.availability.reason === 'PERMISSION_DENIED' &&
    referenceInfo.published.availability.reason === 'PERMISSION_DENIED'
  ) {
    return (
      <Stack space={2} padding={1}>
        Insufficient permissions to view this document
      </Stack>
    )
  }
  return (
    <PreviewComponent
      referenceInfo={referenceInfo}
      refType={props.type.to.find((toType) => toType.name === referenceInfo.type)}
      showTypeLabel={props.type.to.length > 1}
    />
  )
}
