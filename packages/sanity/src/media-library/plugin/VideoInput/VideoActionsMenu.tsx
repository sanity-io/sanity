import {Box, Card} from '@sanity/ui'
import {type CSSProperties, lazy, type ReactNode, type RefObject, Suspense} from 'react'

import {MenuActionsWrapper} from '../../../core/form/inputs/files/common/MenuActionsWrapper.styled'
import {OptionsMenuPopover} from '../../../core/form/inputs/files/common/OptionsMenuPopover'
import {RatioBox} from './styles'
import {type VideoPlaybackTokens} from './types'
import {VideoSkeleton} from './VideoSkeleton'

const VideoPlayer = lazy(() =>
  import('./VideoPlayer').then((module) => ({default: module.VideoPlayer})),
)

type Props = {
  customDomain: string
  children: ReactNode
  aspectRatio?: number
  playbackId?: string
  tokens?: VideoPlaybackTokens
  onClick?: () => void
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
}

export function VideoActionsMenu(props: Props) {
  const {
    customDomain,
    playbackId,
    tokens,
    children,
    aspectRatio,
    muted,
    disabled,
    onClick,
    isMenuOpen,
    onMenuOpen,
    menuButtonRef,
  } = props

  return (
    <Box>
      <Card as={muted || disabled ? undefined : 'button'} tone="inherit" onClick={onClick} flex={1}>
        <RatioBox
          tone="transparent"
          $isPortrait={aspectRatio !== undefined && aspectRatio < 0.75}
          style={
            {
              '--aspect-ratio': aspectRatio,
            } as CSSProperties
          }
        >
          {playbackId && (
            <Suspense fallback={<VideoSkeleton aspectRatio={aspectRatio} />}>
              <VideoPlayer
                customDomain={customDomain}
                playbackId={playbackId}
                tokens={tokens}
                aspectRatio={aspectRatio}
              />
            </Suspense>
          )}
        </RatioBox>
      </Card>

      <MenuActionsWrapper padding={2}>
        <OptionsMenuPopover
          // eslint-disable-next-line @sanity/i18n/no-attribute-string-literals -- it's a translation key, not an attribute string literal
          ariaLabelKey="inputs.file.actions-menu.video-options.aria-label"
          id="video-actions-menu"
          isMenuOpen={isMenuOpen}
          menuButtonRef={menuButtonRef}
          onMenuOpen={onMenuOpen}
        >
          {children}
        </OptionsMenuPopover>
      </MenuActionsWrapper>
    </Box>
  )
}
