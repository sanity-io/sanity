// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />
import React, {useCallback, useMemo} from 'react'
import {ButtonProps} from '@sanity/base/__legacy/@sanity/components'
import PlusIcon from 'part:@sanity/base/plus-icon'
import Button from 'part:@sanity/components/buttons/default'
import {MenuButton} from '../../../legacyParts'
import {BlockItem} from './types'

import styles from './InsertMenu.module.css'

interface InsertMenuProps {
  disabled: boolean
  items: BlockItem[]
  readOnly: boolean
}

export default function InsertMenu(props: InsertMenuProps) {
  const {disabled, items, readOnly} = props
  const [open, setOpen] = React.useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const menu = useMemo(
    () => (
      <div className={styles.menu}>
        {items.map((item) => (
          <InsertMenuItem item={item} onClick={handleClose} key={item.key} />
        ))}
      </div>
    ),
    [handleClose, items]
  )

  return (
    <div className={styles.root}>
      <MenuButton
        buttonProps={{
          'aria-label': 'Insert elements',
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': 'insertmenu',
          disabled: disabled || readOnly,
          icon: PlusIcon,
          kind: 'simple',
          padding: 'small',
          selected: open,
          title: 'Insert elements',
        }}
        menu={menu}
        open={open}
        placement="bottom"
        portal
        setOpen={setOpen}
      />
    </div>
  )
}

function InsertMenuItem({
  item,
  onClick,
  ...restProps
}: {item: BlockItem} & Omit<
  ButtonProps,
  'aria-label' | 'children' | 'className' | 'disabled' | 'icon' | 'title' | 'type'
>) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      item.handle()
      if (onClick) onClick(event)
    },
    [item, onClick]
  )

  const title = item.type.title || item.type.type.name

  return (
    <Button
      {...restProps}
      aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
      bleed
      className={styles.menuItem}
      disabled={item.disabled}
      icon={item.icon}
      kind="simple"
      onClick={handleClick}
      title={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
    >
      {title}
    </Button>
  )
}
