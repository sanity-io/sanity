import React, {ComponentType, ReactNode, Fragment} from 'react'
import {Reference, ReferenceSchemaType} from '@sanity/types'
import {Box, Flex, Inline, Label, Stack, Text, Tooltip} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon} from '@sanity/icons'
import {RenderPreviewCallback} from '../../types'
import {SanityDefaultPreview} from '../../../preview'
import {TextWithTone} from '../../../components'
import {ReferencePreview} from './ReferencePreview'
import {Loadable} from './useReferenceInfo'
import {ReferenceInfo} from './types'

export function PreviewReferenceValue(props: {
  referenceInfo: Loadable<ReferenceInfo>
  renderPreview: RenderPreviewCallback
  type: ReferenceSchemaType
  value: Reference
  showTypeLabel?: boolean
}) {
  const {referenceInfo, renderPreview, type, value, showTypeLabel} = props

  if (referenceInfo.isLoading || referenceInfo.error) {
    return <SanityDefaultPreview isPlaceholder />
  }

  if (referenceInfo.result?.availability.reason === 'NOT_FOUND' && value._strengthenOnPublish) {
    const refType = type.to.find((toType) => toType.name === value?._strengthenOnPublish?.type)
    if (!refType) {
      return <div>Invalid reference type</div>
    }
    if (value._strengthenOnPublish) {
      const stub = value._strengthenOnPublish?.type
        ? {
            _id: value._ref,
            _type: value._strengthenOnPublish?.type,
          }
        : value

      return (
        <Flex align="center">
          <Box flex={1}>
            {renderPreview({
              layout: 'default',
              schemaType: refType,
              value: stub,
              skipVisibilityCheck: true,
            })}
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

  const availability = referenceInfo.result.availability

  const notFound = availability.reason === 'NOT_FOUND'
  const insufficientPermissions = availability.reason === 'PERMISSION_DENIED'
  if (insufficientPermissions || notFound) {
    return (
      <Inline space={2}>
        <Box padding={1}>
          <Flex align="center">
            <Box flex={1} paddingY={2}>
              <Text muted>Document unavailable</Text>
            </Box>
          </Flex>
        </Box>
        {insufficientPermissions || notFound ? (
          <Box>
            <Tooltip
              portal
              content={
                notFound ? (
                  <UnavailableMessage title="Not found" icon={HelpCircleIcon}>
                    The referenced document does not exist
                    <br />
                    (id: <code>{value._ref}</code>)
                  </UnavailableMessage>
                ) : (
                  <UnavailableMessage title="Insufficcient permissions" icon={AccessDeniedIcon}>
                    The referenced document could not be accessed due to insufficient permissions
                  </UnavailableMessage>
                )
              }
            >
              <TextWithTone tone="default">
                <HelpCircleIcon />
              </TextWithTone>
            </Tooltip>
          </Box>
        ) : null}
      </Inline>
    )
  }

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
      id={value._ref}
      layout="default"
      preview={referenceInfo.result?.preview}
      refType={refType}
      renderPreview={renderPreview}
      showTypeLabel={showTypeLabel}
    />
  )
}

function UnavailableMessage(props: {icon: ComponentType; children: ReactNode; title: ReactNode}) {
  const Icon = props.icon
  return (
    <Flex padding={3}>
      <Box>
        <Text size={1}>
          <Icon />
        </Text>
      </Box>
      <Box flex={1} marginLeft={3}>
        <Text size={1} weight="semibold">
          {props.title}
        </Text>

        <Box marginTop={3}>
          <Text as="p" muted size={1}>
            {props.children}
          </Text>
        </Box>
      </Box>
    </Flex>
  )
}
