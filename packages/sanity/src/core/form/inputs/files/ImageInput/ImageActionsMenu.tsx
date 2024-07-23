import {CropIcon} from '@sanity/icons'
import {Inline, Menu, Skeleton, useClickOutsideEvent, useGlobalKeyDown} from '@sanity/ui'
import {type MouseEventHandler, type ReactNode, useCallback, useEffect, useState} from 'react'
import {styled} from 'styled-components'

import {Button, Popover, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {ContextMenuButton} from '../../../../components/contextMenuButton'
import {useTranslation} from '../../../../i18n'

export const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
`

export const ImageActionsMenuWaitPlaceholder = () => (
  <MenuActionsWrapper padding={2}>
    <Skeleton style={{width: '25px', height: '25px'}} animated />
  </MenuActionsWrapper>
)

interface ImageActionsMenuProps {
  children: ReactNode
  onEdit: MouseEventHandler<HTMLButtonElement>
  setHotspotButtonElement: (element: HTMLButtonElement | null) => void
  setMenuButtonElement: (element: HTMLButtonElement | null) => void
  showEdit: boolean
  isMenuOpen: boolean
  onMenuOpen: (flag: boolean) => void
}

export function ImageActionsMenu(props: ImageActionsMenuProps) {
  const {
    onEdit,
    children,
    showEdit,
    setHotspotButtonElement,
    setMenuButtonElement,
    onMenuOpen,
    isMenuOpen,
  } = props

  const [menuElement, setMenuElement] = useState<HTMLDivElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const handleClick = useCallback(() => onMenuOpen(!isMenuOpen), [onMenuOpen, isMenuOpen])

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
  return (
    <TooltipDelayGroupProvider>
      <MenuActionsWrapper data-buttons space={1} padding={2}>
        {showEdit && (
          <Button
            aria-label={t('inputs.image.actions-menu.edit-details.aria-label')}
            data-testid="options-menu-edit-details"
            icon={CropIcon}
            mode="ghost"
            onClick={onEdit}
            ref={setHotspotButtonElement}
            tooltipProps={{content: t('inputs.image.actions-menu.crop-image-tooltip')}}
          />
        )}
        {/* Using a customized Popover instead of MenuButton because a MenuButton will close on click
     and break replacing an uploaded file. */}
        <Popover
          id="image-actions-menu"
          content={<Menu ref={setMenuElement}>{children}</Menu>}
          portal
          open={isMenuOpen}
          constrainSize
        >
          <ContextMenuButton
            aria-label={t('inputs.image.actions-menu.options.aria-label')}
            data-testid="options-menu-button"
            mode="ghost"
            onClick={handleClick}
            ref={setOptionsButtonRef}
          />
        </Popover>
      </MenuActionsWrapper>
    </TooltipDelayGroupProvider>
  )
}
