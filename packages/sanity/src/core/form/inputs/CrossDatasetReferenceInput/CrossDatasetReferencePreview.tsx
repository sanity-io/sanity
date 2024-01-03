import React, {createElement, useMemo} from 'react'
import type {CrossDatasetType, PreviewValue} from '@sanity/types'
import {Badge, Box, Flex, Inline, Text} from '@sanity/ui'
import {AccessDeniedIcon, HelpCircleIcon, LaunchIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {isImageSource} from '@sanity/asset-utils'
import {Tooltip} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import type {DocumentAvailability} from '../../../preview'
import {DefaultPreview, TextWithTone, type PreviewMediaDimensions} from '../../../components'
import {FIXME} from '../../../FIXME'
import {StyledPreviewFlex} from './CrossDatasetReferencePreview.styled'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 *
 * @internal
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
  const {t} = useTranslation()

  const media = useMemo(() => {
    if (previewMedia) {
      const isValidImageAsset =
        typeof (previewMedia as FIXME)?.asset !== 'undefined' && isImageSource(previewMedia)
      const isValidElement = React.isValidElement(previewMedia)

      if (!isValidImageAsset && !isValidElement) {
        return null
      }

      return function MediaPreview({dimensions}: {dimensions: PreviewMediaDimensions}) {
        return isValidElement ? (
          previewMedia
        ) : (
          <img
            src={imageUrlBuilder({dataset, projectId})
              .image(previewMedia as FIXME)
              .withOptions(dimensions)
              .url()}
            alt={t('inputs.reference.image-preview-alt-text')}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      }
    }
    return refType?.icon ? createElement(refType.icon) : null
  }, [previewMedia, dataset, projectId, refType?.icon, t])

  return (
    <StyledPreviewFlex align="center" justify="center" flex={1} data-testid="preview">
      {availability?.available ? (
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
              <Text muted>{t('inputs.reference.error.document-unavailable-title')}</Text>
            </Box>
          </Flex>
        </Box>
      )}

      <Box paddingLeft={3}>
        <Inline space={4}>
          {refType && showTypeLabel && (
            <Badge mode="outline">{refType.title || refType.type}</Badge>
          )}

          {(insufficientPermissions || notFound) && (
            <Box>
              <Tooltip
                portal
                content={t(
                  notFound
                    ? 'inputs.reference.referenced-document-does-not-exist'
                    : 'inputs.reference.referenced-document-insufficient-permissions',
                  {documentId: id},
                )}
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
                content={t(
                  hasStudioUrl
                    ? 'inputs.reference.document-opens-in-new-tab'
                    : 'input.reference.document-cannot-be-opened.failed-to-resolve-url',
                )}
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
