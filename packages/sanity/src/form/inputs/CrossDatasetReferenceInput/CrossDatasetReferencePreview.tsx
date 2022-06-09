import React, {ComponentType, createElement, ReactNode, useMemo} from 'react'
import {CrossDatasetType, PreviewValue} from '@sanity/types'
import {Box, Flex, Inline, Label, Text, Tooltip} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon, LaunchIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {DefaultPreview, PreviewMediaDimensions} from '../../../components/previews'
import {TextWithTone} from '../../../components/TextWithTone'
import {FIXME} from '../../types'
import {DocumentAvailability} from '../../../preview'

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

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 */
export function CrossDatasetReferencePreview(props: {
  availability: DocumentAvailability | null
  id: string
  hasStudioUrl?: boolean
  showStudioUrlIcon?: boolean
  preview: {published: PreviewValue | undefined}
  dataset: string
  projectId: string
  refType?: CrossDatasetType
  showTypeLabel: boolean
}) {
  const {
    refType,
    showStudioUrlIcon,
    hasStudioUrl,
    showTypeLabel,
    availability,
    preview,
    id,
    dataset,
    projectId,
  } = props
  const notFound = availability?.reason === 'NOT_FOUND'
  const insufficientPermissions = availability?.reason === 'PERMISSION_DENIED'

  const previewMedia = preview.published?.media

  const media = useMemo(() => {
    if (previewMedia) {
      return function MediaPreview({dimensions}: {dimensions: PreviewMediaDimensions}) {
        return React.isValidElement(previewMedia) ? (
          previewMedia
        ) : (
          <img
            src={imageUrlBuilder({dataset, projectId})
              .image(previewMedia as FIXME)
              .withOptions(dimensions)
              .url()}
            alt="Image preview of referenced document"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      }
    }
    return refType?.icon ? createElement(refType.icon) : null
  }, [previewMedia, dataset, projectId, refType?.icon])

  return (
    <Flex align="center" data-testid="preview">
      {availability?.available ? (
        <Box flex={1} paddingX={2} paddingY={1}>
          <DefaultPreview
            title={preview.published?.title}
            subtitle={preview.published?.subtitle}
            media={media || false}
          />
        </Box>
      ) : (
        <Box flex={1} padding={2}>
          <Flex align="center" justify="center">
            <Box flex={1} paddingY={2}>
              <Text muted>Document unavailable</Text>
            </Box>
          </Flex>
        </Box>
      )}

      <Box paddingLeft={3}>
        <Inline space={4}>
          {refType && showTypeLabel && (
            <Label size={1} muted>
              {refType.title || refType.type}
            </Label>
          )}

          {(insufficientPermissions || notFound) && (
            <Box>
              <Tooltip
                portal
                content={
                  notFound ? (
                    <UnavailableMessage title="Not found" icon={HelpCircleIcon}>
                      The referenced document does not exist
                      <br />
                      (id: <code>{id}</code>)
                    </UnavailableMessage>
                  ) : (
                    <UnavailableMessage title="Insufficient permissions" icon={AccessDeniedIcon}>
                      The referenced document could not be accessed due to insufficient permissions
                    </UnavailableMessage>
                  )
                }
              >
                <TextWithTone tone="default">
                  {insufficientPermissions ? <AccessDeniedIcon /> : <HelpCircleIcon />}
                </TextWithTone>
              </Tooltip>
            </Box>
          )}

          {!(notFound || insufficientPermissions) && showStudioUrlIcon && (
            <Box>
              <Tooltip
                portal
                content={
                  <Box padding={2}>
                    {hasStudioUrl ? (
                      <Text size={1}>This document opens in another Studio</Text>
                    ) : (
                      <Text size={1}>
                        This document cannot be opened (unable to resolve URL to Studio)
                      </Text>
                    )}
                  </Box>
                }
              >
                <TextWithTone size={1} tone="default" muted={!hasStudioUrl}>
                  <LaunchIcon />
                </TextWithTone>
              </Tooltip>
            </Box>
          )}
        </Inline>
      </Box>
    </Flex>
  )
}
