import {Box, Flex, Skeleton, Stack, Text, TextSkeleton, rem} from '@sanity/ui'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import {useTranslation} from '../../../i18n'
import {PreviewMediaDimensions, PreviewProps} from '../types'
import {PREVIEW_SIZES} from '../constants'
import {renderPreviewNode} from '../helpers'
import {Media} from '../_common/Media'

/**
 * @hidden
 * @beta */
export type CompactPreviewProps = Omit<PreviewProps<'compact'>, 'renderDefault'>

const DEFAULT_MEDIA_DIMENSIONS: PreviewMediaDimensions = {
  ...PREVIEW_SIZES.compact.media,
  aspect: 1,
  fit: 'crop',
  dpr: getDevicePixelRatio(),
}

const Root = styled(Flex)`
  height: ${rem(PREVIEW_SIZES.compact.media.height)};
`

const TitleSkeleton = styled(TextSkeleton).attrs({animated: true, radius: 1, size: 1})`
  max-width: ${rem(160)};
  width: 80%;
`

/**
 * @hidden
 * @beta */
export function CompactPreview(props: CompactPreviewProps) {
  const {children, isPlaceholder, media, status, title} = props

  const {t} = useTranslation()

  const statusNode = status && (
    <Box data-testid="compact-preview__status" paddingLeft={4} paddingRight={1}>
      {renderPreviewNode(status, 'compact')}
    </Box>
  )

  if (isPlaceholder) {
    return (
      <Root
        align="center"
        data-testid="default-preview"
        paddingLeft={media ? 1 : 2}
        paddingRight={2}
        paddingY={1}
      >
        <Flex align="center" flex={1} gap={2}>
          {media && <Skeleton animated radius={2} style={PREVIEW_SIZES.compact.media} />}

          <Stack data-testid="compact-preview__heading" flex={1} space={2}>
            <TitleSkeleton />
          </Stack>

          {statusNode}
        </Flex>
      </Root>
    )
  }

  return (
    <Root
      align="center"
      data-testid="compact-preview"
      paddingLeft={media ? 1 : 2}
      paddingRight={2}
      paddingY={1}
    >
      <Flex align="center" flex={1} gap={2}>
        {media && (
          <Media
            border={false}
            dimensions={DEFAULT_MEDIA_DIMENSIONS}
            layout="compact"
            media={media as any}
          />
        )}
        <Stack data-testid="compact-preview__header" flex={1} space={2}>
          <Text size={1} style={{color: 'inherit'}} textOverflow="ellipsis" weight="medium">
            {title && renderPreviewNode(title, 'compact')}
            {!title && (
              <span style={{color: 'var(--card-muted-fg-color)'}}>
                {t('preview.default.title-fallback')}
              </span>
            )}
          </Text>
        </Stack>

        {statusNode}
      </Flex>

      {children && <Box marginLeft={1}>{children}</Box>}
    </Root>
  )
}
