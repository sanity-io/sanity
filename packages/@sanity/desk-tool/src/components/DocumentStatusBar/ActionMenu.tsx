import styles from './DocumentStatusBarActions.css'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import React from 'react'
import {useId} from '@reach/auto-id'

import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import useOnClickOutside from 'use-onclickoutside'

function getNext<T>(array: T[], fromIndex: number, dir = 1): T {
  const next = fromIndex + dir
  return array[next >= array.length ? 0 : next < 0 ? array.length - 1 : next]
}

interface Props {
  actions: any[]
  onOpen: () => void
  onClose: () => void
  isOpen: boolean
  editState
}

export function ActionMenu({actionStates, onOpen, onClose, isOpen}) {
  const clickOutsideRef = React.useRef(null)
  useOnClickOutside(clickOutsideRef, onClose)
  const idPrefix = useId()

  const [activeAction, setActiveAction] = React.useState(actionStates[0])

  const listRef = React.useRef<HTMLElement>()

  React.useEffect(() => {
    setActiveAction(actionStates[0])
  }, [isOpen])

  React.useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector('[data-has-focus]')
      if (el) {
        el.focus()
      }
    }
  }, [activeAction, actionStates])

  const handleKeyDown = React.useCallback(
    event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return
      }
      const dir = event.key === 'ArrowUp' ? 1 : -1
      const enabledActions = actionStates.filter(state => state === activeAction || !state.disabled)

      setActiveAction(getNext(enabledActions, enabledActions.indexOf(activeAction), dir))
    },
    [activeAction, actionStates]
  )

  return (
    <div className={styles.actionsDropDown} ref={clickOutsideRef} onKeyDown={handleKeyDown}>
      <Button
        aria-controls={`${idPrefix}-menu`}
        aria-haspopup="true"
        aria-label="Actions"
        className={styles.actionsDropDownButton}
        // disabled={isDisconnected} (todo: make a global thing)
        icon={ChevronDownIcon}
        id={`${idPrefix}-button`}
        kind="secondary"
        onClick={onOpen}
      />

      {isOpen && (
        <div className={styles.menuContainer}>
          <ul
            aria-labelledby={`${idPrefix}-button`}
            className={styles.menu}
            id={`${idPrefix}-menu`}
            role="menu"
            // todo: run this through marius
            style={{display: 'flex', flexDirection: 'column-reverse'}}
            ref={listRef}
          >
            {actionStates.map((actionState, idx) => {
              return (
                <li key={idx} className={styles.menuItem} role="presentation">
                  <button
                    {...(actionState === activeAction && {['data-has-focus']: true})}
                    aria-label={actionState.label}
                    className={styles.menuItemButton}
                    disabled={actionState.disabled}
                    onClick={actionState.onHandle}
                    role="menuitem"
                    tabIndex={-1}
                    type="button"
                  >
                    <div tabIndex={-1}>
                      {actionState.icon && (
                        <span className={styles.menuItemIcon}>
                          {React.createElement(actionState.icon)}
                        </span>
                      )}
                      <span className={styles.menuItemLabel}>{actionState.label}</span>
                      {actionState.hotkeys && (
                        <span className={styles.menuItemHotkeys}>
                          <Hotkeys keys={actionState.hotkeys} />
                        </span>
                      )}
                    </div>
                  </button>
                  {actionState.dialog && actionState.dialog.content}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
