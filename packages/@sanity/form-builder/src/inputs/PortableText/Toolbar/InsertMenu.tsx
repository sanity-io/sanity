import {ButtonProps} from '@sanity/base/__legacy/@sanity/components'
import {AddIcon} from '@sanity/icons'
import Button from 'part:@sanity/components/buttons/default'
import {MenuButton} from 'part:@sanity/components/menu-button'
import React, {useCallback} from 'react'
import {BlockItem} from './types'

import styles from './InsertMenu.css'

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

  const menu = (
    <div className={styles.menu}>
      {items.map((item) => (
        <InsertMenuItem item={item} onClick={handleClose} key={item.key} />
      ))}
    </div>
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
          icon: AddIcon,
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
