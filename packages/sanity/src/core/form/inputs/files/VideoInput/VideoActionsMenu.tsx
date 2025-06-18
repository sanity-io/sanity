// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unassigned-import
import 'player.style/sutro'

import MuxPlayer from '@mux/mux-player-react'
import {Box, Card, Inline, Menu, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type CSSProperties, type ReactNode, useCallback, useEffect, useState} from 'react'
import {styled} from 'styled-components'

import {Popover} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'
import {RatioBox} from './styles'

type Props = {
  children: ReactNode
  aspectRatio?: number
  playbackId?: string
  onClick?: () => void
  muted?: boolean
  disabled?: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
  setMenuButtonElement: (element: HTMLButtonElement | null) => void
}

export const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
`

export function VideoActionsMenu(props: Props) {
  const {
    playbackId,
    children,
    aspectRatio,
    muted,
    disabled,
    onClick,
    isMenuOpen,
    onMenuOpen,
    setMenuButtonElement,
  } = props
  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(true), [onMenuOpen])

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          buttonElement?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, buttonElement],
    ),
  )

  // Close menu when clicking outside of it
  // Not when clicking on the button
  useClickOutsideEvent(
    (event) => {
      if (!buttonElement?.contains(event.target as Node)) {
        onMenuOpen(false)
      }
    },
    () => [menuElement],
  )

  const setOptionsButtonRef = useCallback(
    (el: HTMLButtonElement | null) => {
      // Pass the button element to the parent component so that it can focus it when e.g. closing dialogs
      setMenuButtonElement(el)

      // Set focus back on the button when closing the menu
      setButtonElement(el)
    },
    [setMenuButtonElement],
  )

  // When the popover is open, focus the menu to enable keyboard navigation
  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  const {t} = useTranslation()
  const isPortrait = aspectRatio && aspectRatio < 1
  const wrapperWidth = isPortrait ? undefined : 'auto'
  const wrapperHeight = isPortrait ? '100%' : undefined

  return (
    <Box>
      <Card as={muted || disabled ? undefined : 'button'} tone="inherit" onClick={onClick} flex={1}>
        <RatioBox
          display="flex"
          tone="transparent"
          style={
            {
              '--aspect-ratio': aspectRatio,
            } as CSSProperties
          }
        >
          {playbackId && (
            <>
              <MuxPlayer
                theme={'sutro' as const}
                playbackId={playbackId}
                autoPlay={false}
                loop={false}
                style={{
                  width: wrapperWidth,
                  height: wrapperHeight,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  aspectRatio,
                }}
              />
            </>
          )}
        </RatioBox>
      </Card>

      <MenuActionsWrapper padding={2}>
        {/* Using a customized Popover instead of MenuButton because a MenuButton will close on click
     and break replacing an uploaded video. */}
        <Popover
          content={<Menu ref={setMenuElement}>{children}</Menu>}
          id="video-actions-menu"
          portal
          open={isMenuOpen}
          constrainSize
        >
          <ContextMenuButton
            aria-label={t('inputs.file.actions-menu.video-options.aria-label')}
            data-testid="options-menu-button"
            onClick={handleClick}
            ref={setOptionsButtonRef}
          />
        </Popover>
      </MenuActionsWrapper>
    </Box>
  )
}
