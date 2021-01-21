import ArrowKeyNavigation from 'boundless-arrow-key-navigation/build'
import classNames from 'classnames'
import styles from 'part:@sanity/components/buttons/dropdown-style'
import {MenuButton} from 'part:@sanity/components/menu-button'
import ChevronDownIcon from 'part:@sanity/base/angle-down-icon'
import {List, Item} from 'part:@sanity/components/lists/default'
import React, {createElement, forwardRef, useCallback, useEffect, useRef, useState} from 'react'
import {useBoundaryElement} from '../boundaryElement'
import {Placement} from '../types'
import {ButtonProps} from './types'

interface DropdownItem {
  title: string
  icon?: React.ComponentType<Record<string, unknown>>
  color?: string
}

interface DropdownButtonProps {
  boundaryElement?: HTMLElement | null
  items: DropdownItem[]
  onAction: (item: DropdownItem) => void
  loading?: boolean
  renderItem?: (item: DropdownItem) => React.ReactElement
  placement?: Placement
  portal?: boolean
  showArrow?: boolean
}

const DropdownMenuItem = forwardRef(
  (
    {
      item,
      onAction,
      onClose,
      renderItem,
    }: {
      item: DropdownItem
      onAction: (i: DropdownItem) => void
      onClose: () => void
      renderItem?: (i: DropdownItem) => React.ReactElement
    },
    ref
  ) => {
    const handleItemClick = useCallback(
      (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        onAction(item)
        onClose()
      },
      [item, onAction, onClose]
    )

    const handleItemKeyPress = useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
          onAction(item)
          onClose()
        }
      },
      [item, onAction, onClose]
    )

    return (
      <Item
        className={styles.menuItem}
        onClick={handleItemClick}
        onKeyPress={handleItemKeyPress}
        tabIndex={-1}
        ref={ref as any}
      >
        {renderItem ? (
          renderItem(item)
        ) : (
          <div className={styles.menuItem__inner} data-color={item.color}>
            {item.icon && (
              <div className={styles.menuItem__iconContainer}>{createElement(item.icon)}</div>
            )}
            <div className={styles.menuItem__label}>{item.title}</div>
          </div>
        )}
      </Item>
    )
  }
)

DropdownMenuItem.displayName = 'DropdownMenuItem'

function DropdownButton(props: DropdownButtonProps & ButtonProps) {
  const {
    boundaryElement,
    children,
    className,
    items,
    onAction,
    placement = 'bottom',
    portal = true,
    renderItem,
    showArrow = true,
    ...restProps
  } = props
  const contextBoundaryElement = useBoundaryElement()

  const firstItemElementRef = useRef<HTMLLIElement | null>(null)
  const [open, setOpen] = useState(false)

  const handleClose = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (open) {
      if (firstItemElementRef.current) {
        firstItemElementRef.current.focus()
      }
    }
  }, [open])

  const menu = (
    <List className={styles.menu}>
      <ArrowKeyNavigation>
        {items.map((item, i) => (
          <DropdownMenuItem
            key={String(i)}
            item={item}
            onAction={onAction}
            onClose={handleClose}
            ref={i === 0 ? firstItemElementRef : undefined}
            renderItem={renderItem}
          />
        ))}
      </ArrowKeyNavigation>
    </List>
  )

  return (
    <MenuButton
      boundaryElement={boundaryElement || contextBoundaryElement}
      buttonContainerClassName={styles.buttonContainer}
      buttonProps={{
        ...restProps,
        className: styles.button,
      }}
      className={classNames(styles.root, className)}
      menu={menu}
      open={open}
      placement={placement}
      portal={portal}
      setOpen={setOpen}
    >
      {showArrow ? (
        <div className={styles.inner}>
          {children && <span className={styles.label}>{children}</span>}
          <span className={styles.iconContainer}>
            <ChevronDownIcon />
          </span>
        </div>
      ) : (
        children
      )}
    </MenuButton>
  )
}

export default DropdownButton
