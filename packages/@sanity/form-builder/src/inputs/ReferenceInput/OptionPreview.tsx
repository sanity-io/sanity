/* eslint-disable max-nested-callbacks,no-nested-ternary */
import React from 'react'
import {ReferenceSchemaType} from '@sanity/types'
import {Stack, TextSkeleton} from '@sanity/ui'
import {Observable} from 'rxjs'
import {Alert} from '../../components/Alert'
import {ReferenceInfo} from './types'
import {useReferenceInfo} from './useReferenceInfo'
import {ReferencePreview} from './ReferencePreview'

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
}) {
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
        availability={referenceInfo.availability}
        preview={referenceInfo.preview}
        refType={refType}
        showTypeLabel={props.type.to.length > 1}
        layout="default"
      />
    )
  )
}
