import {Menu, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type ReactNode, type RefObject, useCallback, useEffect, useState} from 'react'

import {Popover} from '../../../../../ui-components/popover/Popover'
import {ContextMenuButton} from '../../../../components/contextMenuButton/ContextMenuButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'

export interface OptionsMenuPopoverProps {
  children: ReactNode
  isMenuOpen: boolean
  onMenuOpen: (open: boolean) => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
  /** Translation key for the options button aria-label */
  ariaLabelKey: string
  id: string
  /** 'open' = always open on click, 'toggle' = toggle open/closed */
  openOnClick?: 'open' | 'toggle'
  /** ContextMenuButton mode, defaults to 'bleed' */
  buttonMode?: 'bleed' | 'ghost'
}

/**
 * Shared Popover + ContextMenuButton + Menu for asset input options menus.
 * Handles focus restoration, click-outside, and keyboard (Escape/Tab).
 *
 * @internal
 */
export function OptionsMenuPopover(props: OptionsMenuPopoverProps) {
  const {
    children,
    isMenuOpen,
    onMenuOpen,
    menuButtonRef,
    ariaLabelKey,
    id,
    openOnClick = 'open',
    buttonMode = 'bleed',
  } = props

  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)

  const setOptionsButtonRef = useCallback(
    (el: HTMLButtonElement | null) => {
      if (menuButtonRef && 'current' in menuButtonRef) {
        ;(menuButtonRef as {current: HTMLButtonElement | null}).current = el
      }
    },
    [menuButtonRef],
  )

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (isMenuOpen && (event.key === 'Escape' || event.key === 'Tab')) {
          onMenuOpen(false)
          menuButtonRef.current?.focus()
        }
      },
      [isMenuOpen, onMenuOpen, menuButtonRef],
    ),
  )

  useClickOutsideEvent(
    () => onMenuOpen(false),
    () => [menuElement, menuButtonRef.current].filter(Boolean),
  )

  useEffect(() => {
    if (isMenuOpen) {
      menuElement?.focus()
    }
  }, [isMenuOpen, menuElement])

  const handleClick = useCallback(
    () => onMenuOpen(openOnClick === 'toggle' ? !isMenuOpen : true),
    [onMenuOpen, openOnClick, isMenuOpen],
  )

  const {t} = useTranslation()

  return (
    <Popover
      content={<Menu ref={setMenuElement}>{children}</Menu>}
      id={id}
      portal
      open={isMenuOpen}
      constrainSize
      animate={false}
    >
      <ContextMenuButton
        aria-label={t(ariaLabelKey)}
        data-testid="options-menu-button"
        mode={buttonMode}
        onClick={handleClick}
        ref={setOptionsButtonRef}
      />
    </Popover>
  )
}
