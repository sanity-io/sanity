import {isImageSource} from '@sanity/asset-utils'
import {AccessDeniedIcon, HelpCircleIcon, LaunchIcon} from '@sanity/icons'
import imageUrlBuilder from '@sanity/image-url'
import {type GlobalDocumentReferenceType, type PreviewValue} from '@sanity/types'
import {Badge, Box, Flex, Inline, Text} from '@sanity/ui'
import {isValidElement as ReactIsValidElement, useMemo} from 'react'

import {Tooltip} from '../../../../ui-components'
import {DefaultPreview, type PreviewMediaDimensions, TextWithTone} from '../../../components'
import {type FIXME} from '../../../FIXME'
import {useTranslation} from '../../../i18n'
import {type DocumentAvailability} from '../../../preview'
import {StyledPreviewFlex} from './GlobalDocumentReferencePreview.styled'
import {resolveProjectDataset} from './utils/resolveProjectDataset'

/**
 * Used to preview a referenced type
 * Takes the reference type as props
 *
 * @internal
 */
export function GlobalDocumentReferencePreview(props: {
  availability: DocumentAvailability | null
  id: string
  hasStudioUrl?: boolean
  showStudioUrlIcon?: boolean
  preview: {published: PreviewValue | undefined}
  resourceType: string
  resourceId: string
  refType?: GlobalDocumentReferenceType
  showTypeLabel: boolean
}): React.JSX.Element {
  const {
    refType,
    showStudioUrlIcon,
    hasStudioUrl,
    showTypeLabel,
    availability,
    preview,
    id,
    resourceType,
    resourceId,
  } = props
  const notFound = availability?.reason === 'NOT_FOUND'
  const insufficientPermissions = availability?.reason === 'PERMISSION_DENIED'

  const previewMedia = preview.published?.media
  const {t} = useTranslation()

  const media = useMemo(() => {
    if (previewMedia) {
      const isValidImageAsset =
        typeof (previewMedia as FIXME)?.asset !== 'undefined' && isImageSource(previewMedia)
      const isValidElement = ReactIsValidElement(previewMedia)

      if (!isValidImageAsset && !isValidElement) {
        return null
      }

      return function MediaPreview({dimensions}: {dimensions: PreviewMediaDimensions}) {
        const projectDataset = resolveProjectDataset(resourceType, resourceId)
        if (!projectDataset) return null

        return isValidElement ? (
          previewMedia
        ) : (
          <img
            src={imageUrlBuilder(projectDataset)
              .image(previewMedia as FIXME)
              .withOptions(dimensions)
              .url()}
            alt={t('inputs.reference.image-preview-alt-text')}
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )
      }
    }
    if (!refType?.icon) return null
    const Icon = refType.icon
    return <Icon />
  }, [previewMedia, resourceType, resourceId, refType?.icon, t])

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
