import {Box, Card, Flex, Popover, type PopoverProps, Text, useClickOutside} from '@sanity/ui'
import {cloneElement, type KeyboardEvent, type ReactElement, useCallback, useState} from 'react'
import ReactFocusLock from 'react-focus-lock'
import {type Path} from 'sanity'
import {css, styled} from 'styled-components'

import {type TreeEditingBreadcrumb} from '../../types'
import {ITEM_HEIGHT, MAX_DISPLAYED_ITEMS} from './constants'
import {TreeEditingBreadcrumbsMenu} from './TreeEditingBreadcrumbsMenu'

const POPOVER_FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['bottom-start']

const RootFlex = styled(Flex)``

const TitleCard = styled(Card)`
  min-height: max-content;
`

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
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  parentArrayTitle?: string
  parentElement: HTMLElement | null
  renderMenuItemTitle?: (title: string) => string
  selectedPath: Path
}

export function TreeEditingBreadcrumbsMenuButton(
  props: TreeEditingBreadcrumbsMenuButtonProps,
): JSX.Element {
  const {
    button,
    items,
    onPathSelect,
    parentArrayTitle,
    parentElement,
    renderMenuItemTitle,
    selectedPath,
  } = props
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

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathSelect(path)
      setOpen(false)
    },
    [onPathSelect],
  )

  useClickOutside(() => setOpen(false), [rootElement, buttonElement])

  const content = (
    <RootFlex direction="column" flex={1} forwardedAs={ReactFocusLock} height="fill" returnFocus>
      <PopoverListFlex
        $itemHeight={ITEM_HEIGHT}
        $maxDisplayedItems={MAX_DISPLAYED_ITEMS}
        direction="column"
        overflow="hidden"
      >
        {parentArrayTitle && (
          <TitleCard borderBottom padding={3} sizing="border">
            <Box paddingX={1} sizing="border">
              <Text muted size={1} textOverflow="ellipsis" weight="semibold">
                {parentArrayTitle}
              </Text>
            </Box>
          </TitleCard>
        )}

        <TreeEditingBreadcrumbsMenu
          items={items}
          onPathSelect={handlePathSelect}
          renderMenuItemTitle={renderMenuItemTitle}
          selectedPath={selectedPath}
        />
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
