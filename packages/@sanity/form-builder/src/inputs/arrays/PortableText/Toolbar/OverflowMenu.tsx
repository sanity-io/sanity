import React, {useEffect, useRef, useState} from 'react'
import classNames from 'classnames'
import {EllipsisHorizontalIcon} from '@sanity/icons'
import {MenuButton} from '../../../../legacyParts'

import styles from './OverflowMenu.css'

interface Action {
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

const preventDefault = (event: any) => {
  event.preventDefault()
  event.stopPropagation()
}

export function OverflowMenu(props: Props) {
  const {
    actionButtonComponent: ActionButton,
    actionMenuItemComponent: ActionMenuItem,
    actions,
    disabled,
  } = props
  const actionBarRef = useRef<HTMLDivElement | null>(null)
  const [actionStates, setActionStates] = useState(
    actions.map((__, index) => ({index, visible: false}))
  )
  const actionStatesRef = useRef(actionStates)
  const showOverflowButton = actionStates.filter((a) => !a.visible).length > 0
  const hiddenActions = actionStates.filter((a) => !a.visible)
  const lastHidden = hiddenActions.length === 1
  const ioRef = useRef<IntersectionObserver | null>(null)
  const [open, setOpen] = useState(false)
  const handleClose = () => setOpen(false)

  useEffect(() => {
    const actionBar = actionBarRef.current

    if (actionBar) {
      const actionContainerEls = Array.from(actionBar.childNodes) as HTMLDivElement[]

      const handleEntries: IntersectionObserverCallback = (entries) => {
        const newActionStates = actionStatesRef.current.slice(0)

        entries.forEach((entry) => {
          const element = entry.target as HTMLDivElement
          const actionIndex = Array.from(actionBar.childNodes).indexOf(element)
          const visible = entry.intersectionRatio === 1

          newActionStates[actionIndex] = {
            index: actionIndex,
            visible,
          }
        })

        setActionStates(() => newActionStates)

        actionStatesRef.current = newActionStates
      }

      // @todo: Improve this to show the last item if there's enough space
      const marginRight = 0

      const io = new window.IntersectionObserver(handleEntries, {
        root: actionBar,
        rootMargin: `0px ${marginRight}px 0px 0px`,
        threshold: [0, 0.1, 0.9, 1],
      })

      actionContainerEls.forEach((actionContainerEl) => io.observe(actionContainerEl))
      ioRef.current = io
    }

    return () => {
      if (ioRef.current) ioRef.current.disconnect()
    }
  }, [lastHidden])

  return (
    <div className={styles.root}>
      <div className={styles.actionBar} ref={actionBarRef}>
        {actions.map((action, actionIndex) => (
          <div
            className={classNames(styles.actionButton, action.firstInGroup && styles.firstInGroup)}
            data-index={actionIndex}
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
        <MenuButton
          buttonProps={{
            'aria-label': 'Menu',
            'aria-haspopup': 'menu',
            'aria-expanded': open,
            'aria-controls': 'insertmenu',
            icon: EllipsisHorizontalIcon,
            kind: 'simple',
            padding: 'small',
            selected: open,
            title: 'More actions',
          }}
          menu={
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
                    onMouseDown={preventDefault} // Needed so the editor doesn't reset selection
                  >
                    <ActionMenuItem action={action} disabled={disabled} onClose={handleClose} />
                  </div>
                )
              })}
            </div>
          }
          open={open}
          placement="bottom"
          portal
          setOpen={setOpen}
        />
      </div>
    </div>
  )
}
