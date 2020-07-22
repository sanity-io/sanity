/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import PlusIcon from 'part:@sanity/base/plus-icon'
import Button from 'part:@sanity/components/buttons/default'
import React from 'react'
import {Tooltip} from 'react-tippy'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import styles from './InsertMenu.css'
import {BlockItem} from './types'

type Props = {
  disabled: boolean
  items: BlockItem[]
  readOnly: boolean
  mode: 'dropdown' | 'dialog' | undefined
}

export default function InsertMenu(props: Props) {
  const {disabled, items, readOnly, mode = 'dropdown'} = props
  const [open, setOpen] = React.useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className={styles.root}>
      {mode === 'dropdown' && (
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
                const itemIsDisabled = item.disabled
                const title = item.type.title || item.type.type.name
                return (
                  <button
                    aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
                    disabled={itemIsDisabled}
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
            disabled={disabled || readOnly}
            icon={PlusIcon}
            kind="simple"
            onClick={handleOpen}
            padding="small"
            selected={open}
            title="Insert elements"
          >
            Insert
          </Button>
        </Tooltip>
      )}
      {mode === 'dialog' && (
        <div>
          <Button
            aria-label="Insert elements"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={'insertmenu'}
            disabled={disabled || readOnly}
            icon={PlusIcon}
            kind="simple"
            onClick={handleOpen}
            padding="small"
            selected={open}
            title="Insert elements"
          >
            Insert
          </Button>
          {open && (
            <Dialog title="Insert elements" isOpen={open} onClose={handleClose}>
              <DialogContent size="large">
                <div className={styles.menuDialog}>
                  {items.map(item => {
                    const itemIsDisabled = item.disabled
                    const title = item.type.title || item.type.type.name
                    if (item.type.hidden) {
                      return null
                    }
                    return (
                      <button
                        aria-label={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
                        disabled={itemIsDisabled}
                        className={styles.menuItem}
                        key={item.key}
                        onClick={() => {
                          item.handle()
                          handleClose()
                        }}
                        title={`Insert ${title}${item.inline ? ' (inline)' : ' (block)'}`}
                        type="button"
                      >
                        <div className={styles.media}>{React.createElement(item.icon)}</div>
                        <div className={styles.heading}>
                          <h2 className={styles.title}>{title}</h2>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}
