import classNames from 'classnames'
import {Box, Text, Tooltip} from '@sanity/ui'
import React, {useCallback, useMemo, useState} from 'react'
import {EditIcon} from '@sanity/icons'
import {ConnectorContext} from './ConnectorContext'

import styles from './ChangeBar.module.css'

function Shape(props: Omit<React.SVGProps<SVGElement>, 'ref'>) {
  return (
    <svg {...props} viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M9 0.448608C9 2.49663 7.38382 4.13678 5.57253 5.09261C2.55605 6.68443 0.5 9.8521 0.5 13.5C0.5 17.1479 2.55605 20.3155 5.57253 21.9074C7.38382 22.8632 9 24.5033 9 26.5514V27H11V26.5514C11 24.5033 12.6162 22.8632 14.4275 21.9074C17.4439 20.3155 19.5 17.1479 19.5 13.5C19.5 9.8521 17.4439 6.68443 14.4275 5.09261C12.6162 4.13678 11 2.49663 11 0.448608V0H9V0.448608Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function ChangeBar(props: {
  children: React.ReactNode
  hasFocus: boolean
  isChanged: boolean
  disabled?: boolean
}) {
  const {children, hasFocus, isChanged, disabled} = props

  const [hover, setHover] = useState(false)
  const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)

  const handleMouseEnter = useCallback(() => setHover(true), [])
  const handleMouseLeave = useCallback(() => setHover(false), [])

  const tooltip = useMemo(
    () =>
      disabled ? null : (
        <Tooltip
          content={
            <Box padding={2}>
              <Text muted size={1}>
                Review changes
              </Text>
            </Box>
          }
          disabled={!isChanged || isReviewChangesOpen}
          placement="top"
          portal
        >
          <div className={styles.wrapper}>
            <div className={styles.bar} />

            <div className={styles.badge}>
              <Shape className={styles.badge__shape} />
              <EditIcon className={styles.badge__icon} />
            </div>

            <button
              tabIndex={isReviewChangesOpen || !isChanged ? -1 : 0}
              type="button"
              aria-label="Review changes"
              onClick={isReviewChangesOpen ? undefined : onOpenReviewChanges}
              className={styles.hitArea}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          </div>
        </Tooltip>
      ),
    [
      handleMouseEnter,
      handleMouseLeave,
      isReviewChangesOpen,
      onOpenReviewChanges,
      isChanged,
      disabled,
    ]
  )

  return (
    <div
      className={
        disabled
          ? undefined
          : classNames(
              styles.root,
              hover && styles.hover,
              hasFocus && styles.focus,
              isChanged && styles.changed,
              isReviewChangesOpen && styles.reviewChangesOpen
            )
      }
    >
      <div className={styles.field}>{children}</div>
      {tooltip}
    </div>
  )
}
