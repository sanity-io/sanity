import React, {ComponentType, ReactNode, Fragment} from 'react'
import {Reference, ReferenceSchemaType} from '@sanity/types'
import {Box, Flex, Inline, Label, Stack, Text} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon} from '@sanity/icons'
import {RenderPreviewCallback} from '../../types'
import {SanityDefaultPreview} from '../../../preview'
import {TextWithTone} from '../../../components'
import {Tooltip} from '../../../../ui'
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

  // Special handling for "create refs in place"
  // When a reference is created in place, the newly created document may not yet exist (or may have been deleted)
  // This is a completely valid case, and we handle it by showing the preview for the referenced type
  if (referenceInfo.result?.availability.reason === 'NOT_FOUND' && value._strengthenOnPublish) {
    const refType = type.to.find((toType) => toType.name === value?._strengthenOnPublish?.type)
    if (!refType) {
      // This means that the reference document type (specified by _strengthenOnPublish.type)
      // is not valid according to schema
      return (
        <InvalidType
          documentId={value._ref}
          actualType={value._strengthenOnPublish?.type}
          declaredTypes={type.to.map((toType) => toType.name)}
        />
      )
    }

    // todo: figure out whether this check is necessary (can value._strengthenOnPublish.type ever be missing)
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
                  <UnavailableMessage title="Insufficient permissions" icon={AccessDeniedIcon}>
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

  const refTypeName = referenceInfo.result?.type
  const refType = type.to.find((toType) => toType.name === refTypeName)

  if (!refType) {
    return (
      <InvalidType
        documentId={value._ref}
        // note: a missing refTypeName here means the document is either loading, doesn't exist or is unreadable by current role.
        // These states should already have been covered by earlier checks
        actualType={refTypeName || '<unknown>'}
        declaredTypes={type.to.map((toType) => toType.name)}
      />
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
    <Flex>
      <Text size={1}>
        <Icon />
      </Text>
      <Box flex={1} marginLeft={3}>
        <Text size={1} weight="medium">
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

function InvalidType(props: {documentId: string; actualType: string; declaredTypes: string[]}) {
  return (
    <Flex align="center" justify="flex-start">
      <Box padding={1}>
        <Flex align="center">
          <Box flex={1} paddingY={2}>
            <Text muted>Document of invalid type</Text>
          </Box>
        </Flex>
      </Box>
      <Box>
        <Tooltip
          portal
          content={
            <Stack space={3}>
              <Text size={1}>
                Referenced document (<code>{props.documentId}</code>) is of type{' '}
                <code>{props.actualType}</code>.
              </Text>
              <Text size={1}>
                According to the schema, referenced documents can only be of type{' '}
                {humanizeList(
                  props.declaredTypes.map((typeName) => <code key={typeName}>{typeName}</code>),
                  'or',
                )}
                .
              </Text>
            </Stack>
          }
        >
          <Box padding={2}>
            <TextWithTone tone="default">
              <HelpCircleIcon />
            </TextWithTone>
          </Box>
        </Tooltip>
      </Box>
    </Flex>
  )
}

const humanizeList = (list: React.ReactNode[], conjunction: string) => {
  if (list.length === 1) {
    return list[0]
  }

  if (list.length === 2) {
    return [list[0], <Fragment key="comma"> {conjunction} </Fragment>, list[1]]
  }

  const subList = list.slice(0, -1)
  return [
    ...subList.map((item, i) => <Fragment key={i}>{item}, </Fragment>),
    <Fragment key="last">
      {conjunction} {list[list.length - 1]}
    </Fragment>,
  ]
}
