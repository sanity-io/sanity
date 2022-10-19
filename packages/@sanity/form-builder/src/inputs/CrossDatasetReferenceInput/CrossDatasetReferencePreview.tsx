import React, {ComponentType, createElement, ReactNode, useMemo} from 'react'

import {CrossDatasetType} from '@sanity/types'
import {DocumentAvailability} from '@sanity/base/_internal'
import {Box, Flex, Inline, Label, Text, Tooltip} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon, LaunchIcon} from '@sanity/icons'
import {DefaultPreview, PreviewMediaDimensions, TextWithTone} from '@sanity/base/components'
import imageUrlBuilder from '@sanity/image-url'

import {DocumentPreview} from './types'
import {StyledPreviewFlex, TooltipContent} from './CrossDatasetReferencePreview.styled'

function UnavailableMessage(props: {children: ReactNode}) {
  return (
    <TooltipContent padding={3}>
      <Box flex={1}>
        <Box>
          <Text as="p" size={1}>
            {props.children}
          </Text>
        </Box>
      </Box>
    </TooltipContent>
  )
}

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 * @param props
 * @constructor
 */
export function CrossDatasetReferencePreview(props: {
  availability: DocumentAvailability
  id: string
  hasStudioUrl?: boolean
  showStudioUrlIcon?: boolean
  preview: {published: DocumentPreview | undefined}
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
  const notFound = availability.reason === 'NOT_FOUND'
  const insufficientPermissions = availability.reason === 'PERMISSION_DENIED'

  const previewMedia = preview.published?.media

  const media = useMemo(() => {
    if (previewMedia) {
      return function MediaPreview({dimensions}: {dimensions: PreviewMediaDimensions}) {
        return React.isValidElement(previewMedia) ? (
          previewMedia
        ) : (
          <img
            src={imageUrlBuilder({dataset, projectId})
              .image(previewMedia as any)
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
    <StyledPreviewFlex align="center" justify="center" flex={1} data-testid="preview">
      {availability.available ? (
        <Box flex={1}>
          <DefaultPreview
            title={preview.published?.title}
            subtitle={preview.published?.subtitle}
            media={media || false}
          />
        </Box>
      ) : (
        <Box flex={1}>
          <Flex align="center">
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
                    <UnavailableMessage>
                      The referenced document no longer exist and might have been deleted.
                      <br />
                      (id: <code>{id}</code>)
                    </UnavailableMessage>
                  ) : (
                    <UnavailableMessage>
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
    </StyledPreviewFlex>
  )
}
