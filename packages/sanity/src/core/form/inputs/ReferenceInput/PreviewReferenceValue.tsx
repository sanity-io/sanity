import React, {ComponentType, ReactNode, Fragment} from 'react'
import type {Reference, ReferenceSchemaType} from '@sanity/types'
import {Box, Flex, Inline, Label, Stack, Text, Tooltip} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon} from '@sanity/icons'
import type {RenderPreviewCallback} from '../../types'
import {SanityDefaultPreview} from '../../../preview'
import {Translate, useIntlListFormat, useTranslation} from '../../../i18n'
import {TextWithTone} from '../../../components'
import {ReferencePreview} from './ReferencePreview'
import {Loadable} from './useReferenceInfo'
import type {ReferenceInfo} from './types'

export function PreviewReferenceValue(props: {
  referenceInfo: Loadable<ReferenceInfo>
  renderPreview: RenderPreviewCallback
  type: ReferenceSchemaType
  value: Reference
  showTypeLabel?: boolean
}) {
  const {referenceInfo, renderPreview, type, value, showTypeLabel} = props
  const {t} = useTranslation()

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
              <Text muted>{t('inputs.reference.error.document-unavailable-title')}</Text>
            </Box>
          </Flex>
        </Box>
        {insufficientPermissions || notFound ? (
          <Box>
            <Tooltip
              portal
              content={
                notFound ? (
                  <UnavailableMessage
                    title={t('inputs.reference.error.nonexistent-document-title')}
                    icon={HelpCircleIcon}
                  >
                    <Translate
                      i18nKey="inputs.reference.error.nonexistent-document-description"
                      t={t}
                      components={{Code: ({children}) => <code>{children}</code>}}
                      values={{documentId: value._ref}}
                    />
                  </UnavailableMessage>
                ) : (
                  <UnavailableMessage
                    title={t('inputs.reference.error.missing-read-permissions-title')}
                    icon={AccessDeniedIcon}
                  >
                    {t('inputs.reference.error.missing-read-permissions-description')}
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

function InvalidType({
  declaredTypes,
  documentId,
  actualType,
}: {
  documentId: string
  actualType: string
  declaredTypes: string[]
}) {
  const {t} = useTranslation()

  return (
    <Flex align="center" justify="flex-start">
      <Box padding={1}>
        <Flex align="center">
          <Box flex={1} paddingY={2}>
            <Text muted>{t('inputs.reference.error.invalid-type-title')}</Text>
          </Box>
        </Flex>
      </Box>
      <Box>
        <Tooltip
          portal
          content={
            <Stack space={3} padding={3}>
              <Text size={1}>
                <Translate
                  t={t}
                  i18nKey="inputs.reference.error.invalid-type-description"
                  values={{documentId, actualType}}
                  components={{
                    AllowedTypes: () => <HumanizedList values={declaredTypes} />,
                    Code: ({children}) => <code>{children}</code>,
                  }}
                />
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

function HumanizedList(props: {values: string[]}) {
  const listFormat = useIntlListFormat({type: 'disjunction'})
  const parts = listFormat.formatToParts(props.values)
  return (
    <Fragment>
      {parts.map((segment) =>
        segment.type === 'element' ? (
          <code key={segment.value}>{segment.value}</code>
        ) : (
          segment.value
        ),
      )}
    </Fragment>
  )
}
