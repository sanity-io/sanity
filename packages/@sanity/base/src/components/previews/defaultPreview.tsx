import React from 'react'
import {Box, Flex, Stack, Text, Skeleton, TextSkeleton} from '@sanity/ui'
import styled from 'styled-components'
import {getDevicePixelRatio} from 'use-device-pixel-ratio'
import classNames from 'classnames'
import {PreviewProps} from './types'

const Root = styled(Flex)`
  height: 35px;
`

const MediaWrapper = styled(Flex)`
  position: relative;
  width: 35px;
  height: 35px;
  min-width: 35px;
  border-radius: ${({theme}) => theme.sanity.radius[2]}px;

  & img {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: inherit;
  }

  & svg {
    display: block;
    font-size: calc(21 / 16 * 1em);

    &[data-sanity-icon] {
      font-size: calc(33 / 16 * 1em);
      margin: calc(6 / 36 * -1em);
    }
  }

  & img + span {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px var(--card-fg-color);
    opacity: 0.2;
    border-radius: inherit;
  }
`

type DefaultPreviewProps = PreviewProps<'default'> & {
  styles?: {
    root?: string
    placeholder?: string
    media?: string
    heading?: string
    title?: string
    subtitle?: string
    hasSubtitle?: string
    mediaString?: string
    status?: string
    children?: string
  }
}

export const DefaultPreview = (props: DefaultPreviewProps) => {
  const {title, subtitle, media, status, isPlaceholder, children, styles = {}} = props
  const rootClassName = classNames(styles.root, subtitle !== undefined && styles.hasSubtitle)

  if (isPlaceholder) {
    return (
      <Root align="center" className={styles.placeholder}>
        {isPlaceholder && (
          <>
            <Skeleton
              style={{width: 35, height: 35}}
              radius={2}
              marginRight={2}
              className={styles.media}
              animated
            />
            <Stack space={2} flex={1}>
              <TextSkeleton style={{maxWidth: 320}} radius={1} animated />
              <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated />
            </Stack>
          </>
        )}
      </Root>
    )
  }

  return (
    <Root align="center" className={rootClassName}>
      <>
        {media !== false && media !== undefined && (
          <MediaWrapper
            align="center"
            justify="center"
            marginRight={2}
            sizing="border"
            overflow="hidden"
            className={styles.media}
          >
            {typeof media === 'function' &&
              media({
                dimensions: {
                  width: 35,
                  height: 35,
                  aspect: 1,
                  fit: 'crop',
                  dpr: getDevicePixelRatio(),
                },
                layout: 'default',
              })}

            {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}

            {React.isValidElement(media) && media}

            <span />
          </MediaWrapper>
        )}

        <Stack space={2} flex={1} className={styles.heading}>
          <Text textOverflow="ellipsis" style={{color: 'inherit'}} className={styles.title}>
            {title && typeof title === 'function' ? title({layout: 'default'}) : title}
            {!title && <>Untitled</>}
          </Text>

          {subtitle && (
            <Text muted size={1} textOverflow="ellipsis" className={styles.subtitle}>
              {typeof subtitle === 'function' ? subtitle({layout: 'default'}) : subtitle}
            </Text>
          )}

          {children && <div className={styles.children}>{children}</div>}
        </Stack>

        {status && (
          <Box padding={3} paddingRight={1} className={styles.status}>
            {typeof status === 'function' ? status({layout: 'default'}) : status}
          </Box>
        )}
      </>
    </Root>
  )
}
