/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import Button from 'part:@sanity/components/buttons/default'
import React from 'react'
import {Tooltip} from 'react-tippy'
import styles from './InsertMenu.css'
import {BlockItem} from './types'

type Props = {
  items: BlockItem[]
  readOnly: boolean
}

export default function InsertMenu(props: Props) {
  const {items, readOnly} = props
  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className={styles.root}>
      <Tooltip
        arrow
        className={styles.initialValueMenuTooltip}
        distance={13}
        theme="light"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        trigger={'click focus' as any}
        position="bottom"
        interactive
        open={open}
        onRequestClose={handleClose}
        useContext
        html={
          <div className={styles.menu}>
            {items.map(item => {
              return (
                <button
                  aria-label={`Insert ${item.title || item.value.type.name}${
                    item.inline ? ' (inline)' : ' (block)'
                  }`}
                  className={styles.menuItem}
                  key={item.key}
                  onClick={item.handle}
                  title={`Insert ${item.title || item.value.type.name}${
                    item.inline ? ' (inline)' : ' (block)'
                  }`}
                  type="button"
                >
                  <span className={styles.iconContainer}>{React.createElement(item.icon)}</span>
                  <span className={styles.title}>{item.title}</span>
                </button>
              )
            })}
          </div>
        }
      >
        <Button
          aria-label="Menu"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={'insertmenu'}
          disabled={readOnly}
          kind="simple"
          onClick={handleOpen}
          padding="small"
          selected={open}
          title="Create new document"
        >
          Insert
        </Button>
      </Tooltip>
    </div>
  )
}
