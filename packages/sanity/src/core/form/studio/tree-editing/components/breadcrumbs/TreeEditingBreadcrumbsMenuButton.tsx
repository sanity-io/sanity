import {Flex, Popover, type PopoverProps, useClickOutside} from '@sanity/ui'
import {cloneElement, type KeyboardEvent, type ReactElement, useCallback, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'
import {css, styled} from 'styled-components'

import {ITEM_HEIGHT, MAX_DISPLAYED_ITEMS} from './constants'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom-start']

const RootFlex = styled(Flex)``

const PopoverListFlex = styled(Flex)<{
  $maxDisplayedItems: number
  $itemHeight: number
}>((props) => {
  const {$maxDisplayedItems, $itemHeight} = props

  return css`
    --item-height: ${$itemHeight}px;
    --max-items: ${$maxDisplayedItems};
    --list-padding: 0.5rem;

    position: relative;
    max-height: calc(var(--item-height) * var(--max-items) + var(--list-padding));
    min-height: calc((var(--item-height) * 1));
  `
})

const StyledPopover = styled(Popover)(() => {
  return css`
    [data-ui='Popover__wrapper'] {
      width: 250px;
      display: flex;
      flex-direction: column;
      border-radius: ${({theme}) => theme.sanity.radius[3]}px;
      position: relative;
      overflow: hidden;
      overflow: clip;
    }
  `
})

interface TreeEditingBreadcrumbsMenuButtonProps {
  button: ReactElement
  popoverContent: ReactElement
  parentElement: HTMLElement | null
}

export function TreeEditingBreadcrumbsMenuButton(
  props: TreeEditingBreadcrumbsMenuButtonProps,
): JSX.Element {
  const {button, popoverContent, parentElement} = props
  const [open, setOpen] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)
  const [buttonElement, setButtonElement] = useState<HTMLButtonElement | null>(null)

  const closeAndFocus = useCallback(() => {
    if (!open) return

    setOpen(false)
    buttonElement?.focus()
  }, [buttonElement, open])

  const handlePopoverKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const {key, shiftKey} = event

      if ((shiftKey && key === 'Tab') || key === 'Escape' || key === 'Tab') {
        closeAndFocus()
      }
    },
    [closeAndFocus],
  )

  const handleButtonClick = useCallback(() => {
    const next = !open

    setOpen(next)
  }, [open])

  useClickOutside(() => setOpen(false), [rootElement, buttonElement])

  const content = (
    <RootFlex direction="column" flex={1} forwardedAs={ReactFocusLock} height="fill" returnFocus>
      <PopoverListFlex
        $itemHeight={ITEM_HEIGHT}
        $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
        direction="column"
        overflow="hidden"
      >
        {popoverContent}
      </PopoverListFlex>
    </RootFlex>
  )

  const clonedButton = cloneElement(button, {
    'aria-expanded': open,
    'aria-haspopup': 'true',
    'id': 'tree-breadcrumb-menu-button',
    'onClick': handleButtonClick,
    'ref': setButtonElement,
    'selected': open,
  })

  return (
    <StyledPopover
      animate
      constrainSize
      referenceBoundary={parentElement}
      content={content}
      fallbackPlacements={POPOVER_FALLBACK_PLACEMENTS}
      onKeyDown={handlePopoverKeyDown}
      open={open}
      placement="bottom-start"
      portal
      ref={setRootElement}
    >
      {clonedButton}
    </StyledPopover>
  )
}
