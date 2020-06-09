/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import classNames from 'classnames'
import React, {useEffect, useRef, useState} from 'react'
import {Tooltip} from 'react-tippy'
import EllipsisIcon from 'part:@sanity/base/ellipsis-icon'
import Button from 'part:@sanity/components/buttons/default'

import styles from './OverflowMenu.css'

type Action = {
  firstInGroup?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface Props {
  actionButtonComponent: React.ComponentType<{action: Action; disabled: boolean; visible: boolean}>
  actionMenuItemComponent: React.ComponentType<{
    action: Action
    disabled: boolean
    onClose: () => void
  }>
  actions: Action[]
  disabled?: boolean
}

export function OverflowMenu(props: Props) {
  const {
    actionButtonComponent: ActionButton,
    actionMenuItemComponent: ActionMenuItem,
    actions,
    disabled
  } = props
  const actionBarRef = useRef<HTMLDivElement | null>(null)
  const [actionStates, setActionStates] = useState(
    actions.map((_, index) => ({index, visible: false}))
  )
  const actionStatesRef = useRef(actionStates)
  const showOverflowButton = actionStates.filter(a => !a.visible).length > 0
  const hiddenActions = actionStates.filter(a => !a.visible)
  const lastHidden = hiddenActions.length === 1
  const ioRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const actionBar = actionBarRef.current

    if (actionBar) {
      const actionContainerEls = Array.from(actionBar.childNodes) as HTMLDivElement[]
      const lastActionEl = actionContainerEls[actionContainerEls.length - 1] as
        | HTMLElement
        | undefined
      const lastWidth = lastActionEl && lastActionEl.offsetWidth

      const handleEntries: IntersectionObserverCallback = entries => {
        const newActionStates = actionStatesRef.current.slice(0)

        entries.forEach(entry => {
          const actionIndex = actionContainerEls.indexOf(entry.target as HTMLDivElement)

          newActionStates[actionIndex] = {
            index: actionIndex,
            visible: entry.intersectionRatio === 1
          }
        })

        setActionStates(newActionStates)

        actionStatesRef.current = newActionStates
      }

      const marginRight = lastHidden ? lastWidth + 4 : 0

      const io = new window.IntersectionObserver(handleEntries, {
        root: actionBar,
        rootMargin: `0px ${marginRight}px 0px 0px`,
        threshold: [0, 1]
      })

      actionContainerEls.forEach(actionContainerEl => io.observe(actionContainerEl))
      ioRef.current = io
    }

    return () => {
      if (ioRef.current) ioRef.current.disconnect()
    }
  }, [lastHidden])

  const [open, setOpen] = useState(false)

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <div className={styles.root}>
      <div className={styles.actionBar} ref={actionBarRef} style={{flex: 1, minWidth: 0}}>
        {actions.map((action, actionIndex) => (
          <div
            className={classNames(styles.actionButton, action.firstInGroup && styles.firstInGroup)}
            data-visible={actionStates[actionIndex].visible}
            key={String(actionIndex)}
          >
            <ActionButton
              action={action}
              disabled={disabled}
              visible={actionStates[actionIndex].visible}
            />
          </div>
        ))}
      </div>
      <div className={styles.overflowButton} hidden={!showOverflowButton}>
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
            <div className={styles.overflowMenu}>
              {hiddenActions.map((hiddenAction, hiddenActionIndex) => {
                const action = actions[hiddenAction.index]

                return (
                  <div
                    className={classNames(
                      styles.menuItem,
                      action.firstInGroup && styles.firstInGroup
                    )}
                    key={String(hiddenActionIndex)}
                  >
                    <ActionMenuItem action={action} disabled={disabled} onClose={handleClose} />
                  </div>
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
            icon={EllipsisIcon}
            kind="simple"
            onClick={handleOpen}
            padding="small"
            selected={open}
            title="More actions"
          />
        </Tooltip>
      </div>
    </div>
  )
}
