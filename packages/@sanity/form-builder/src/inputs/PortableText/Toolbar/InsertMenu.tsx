/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import PlusIcon from 'part:@sanity/base/plus-icon'
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
        trigger={'click'}
        position="bottom"
        interactive
        open={open}
        onRequestClose={handleClose}
        useContext
        html={
          <div className={styles.menu}>
            {items.map(item => {
              const title = item.type.title || item.type.type.name

              return (
                <button
                  aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
                  className={styles.menuItem}
                  key={item.key}
                  onClick={() => {
                    item.handle()
                    handleClose()
                  }}
                  title={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
                  type="button"
                >
                  <span className={styles.iconContainer}>{React.createElement(item.icon)}</span>
                  <span className={styles.title}>{title}</span>
                </button>
              )
            })}
          </div>
        }
      >
        <Button
          aria-label="Insert elements"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={'insertmenu'}
          disabled={readOnly}
          icon={PlusIcon}
          kind="simple"
          onClick={handleOpen}
          padding="small"
          selected={open}
          title="Insert elements"
        />
      </Tooltip>
    </div>
  )
}
