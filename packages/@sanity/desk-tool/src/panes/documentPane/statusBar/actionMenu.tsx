import {useId} from '@reach/auto-id'
import Button from 'part:@sanity/components/buttons/default'
import Hotkeys from 'part:@sanity/components/typography/hotkeys'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import React, {createElement, useCallback, useEffect, useRef, useState} from 'react'
import useOnClickOutside from 'use-onclickoutside'
import {ActionStateDialog} from './actionStateDialog'

import styles from './documentStatusBarActions.css'

function getNext<T>(array: T[], fromIndex: number, dir = 1): T {
  const next = fromIndex + dir

  // eslint-disable-next-line no-nested-ternary
  return array[next >= array.length ? 0 : next < 0 ? array.length - 1 : next]
}

interface Props {
  actionStates: any[]
  onOpen: () => void
  onClose: () => void
  isOpen: boolean
  disabled: boolean
}

export function ActionMenu({actionStates, onOpen, onClose, disabled, isOpen}: Props) {
  const clickOutsideRef = useRef(null)
  const listRef = useRef<HTMLUListElement>(null)
  const idPrefix = useId()

  useOnClickOutside(clickOutsideRef, () => {
    if (!isOpen) {
      return
    }
    // this is a bit hacky, but if there is a modal open, we should not close on outside clicks
    const hasOpenDialog = actionStates.some(state => state.dialog)
    if (!hasOpenDialog) {
      onClose()
    }
  })

  const [activeAction, setActiveAction] = useState(actionStates.find(s => !s.disabled))

  useEffect(() => {
    setActiveAction(actionStates.find(s => !s.disabled))
  }, [actionStates, isOpen])

  useEffect(() => {
    if (listRef.current) {
      const el: HTMLUListElement | null = listRef.current.querySelector('[data-has-focus]')
      if (el) {
        el.focus()
      }
    }
  }, [activeAction, actionStates])

  const handleKeyDown = useCallback(
    event => {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') {
        return
      }
      const dir = event.key === 'ArrowUp' ? -1 : 1
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
        disabled={disabled}
        icon={ChevronDownIcon}
        id={`${idPrefix}-button`}
        kind="secondary"
        onClick={isOpen ? onClose : onOpen}
      />

      {isOpen && (
        <div className={styles.menuContainer}>
          <ul
            aria-labelledby={`${idPrefix}-button`}
            className={styles.menu}
            id={`${idPrefix}-menu`}
            role="menu"
            ref={listRef}
          >
            {actionStates.map((actionState, idx) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <li key={idx} className={styles.menuItem} role="presentation">
                  <button
                    {...(actionState === activeAction && {'data-has-focus': true})}
                    aria-label={actionState.label}
                    className={styles.menuItemButton}
                    disabled={disabled || Boolean(actionState.disabled)}
                    title={actionState.title}
                    onClick={actionState.onHandle}
                    role="menuitem"
                    tabIndex={-1}
                    type="button"
                  >
                    <div tabIndex={-1}>
                      {actionState.icon && (
                        <span className={styles.menuItemIcon}>
                          {createElement(actionState.icon)}
                        </span>
                      )}
                      <span className={styles.menuItemLabel}>{actionState.label}</span>
                      {actionState.shortcut && (
                        <span className={styles.menuItemHotkeys}>
                          <Hotkeys keys={String(actionState.shortcut).split('+')} size="small" />
                        </span>
                      )}
                    </div>
                  </button>
                  {actionState.dialog && <ActionStateDialog dialog={actionState.dialog} />}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
