import React from 'react'
import {Reference, ReferenceSchemaType} from '@sanity/types'
import {Box, Flex, Inline, Label, Stack, TextSkeleton} from '@sanity/ui'
import Preview from '../../Preview'
import {ReferencePreview} from './ReferencePreview'
import {Loadable} from './useReferenceInfo'
import {ReferenceInfo} from './types'

export function PreviewReferenceValue(props: {
  value: Reference
  type: ReferenceSchemaType
  referenceInfo: Loadable<ReferenceInfo>
  selected?: boolean
}) {
  const {value, type, referenceInfo, selected} = props

  if (referenceInfo.isLoading || referenceInfo.error) {
    return (
      <Stack space={2} padding={1}>
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated={!referenceInfo.error} />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated={!referenceInfo.error} />
      </Stack>
    )
  }
  const showTypeLabel = type.to.length > 1

  if (referenceInfo.result.availability.reason === 'NOT_FOUND' && value._strengthenOnPublish) {
    const refType = type.to.find((toType) => toType.name === value?._strengthenOnPublish?.type)
    if (!refType) {
      return <div>Invalid reference type</div>
    }
    if (value._strengthenOnPublish) {
      const stub = {
        _id: value._ref,
        _type: value._strengthenOnPublish?.type,
      }
      return (
        <Flex align="center">
          <Box flex={1}>
            <Preview type={refType} value={stub} layout="default" />
          </Box>
          <Box>
            <Inline space={4}>
              {showTypeLabel && (
                <Label size={1} muted>
                  {refType.title}
                </Label>
              )}
            </Inline>
          </Box>
        </Flex>
      )
    }
  }

  const refTypeName = referenceInfo.result?.type
  const refType = type.to.find((toType) => toType.name === refTypeName)

  if (!refType) {
    return (
      <Stack space={2} padding={2}>
        The referenced document is of invalid type: ({refTypeName || 'unknown'})
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </Stack>
    )
  }

  return (
    <ReferencePreview
      availability={referenceInfo.result.availability}
      preview={referenceInfo.result.preview}
      refType={refType}
      id={value._ref}
      showTypeLabel={showTypeLabel}
      __workaround_selected={selected}
      layout="default"
    />
  )
}
