import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback} from 'react'
import RestoreIcon from '../components/icons/History'
import {ConnectorContext} from './ChangeIndicatorContext'

import styles from './ChangeBar.css'

export const ChangeBar = React.forwardRef(
  (props: {isChanged: boolean; children: React.ReactNode}, ref: any) => {
    const [isPopoverOpen, setPopoverOpen] = React.useState(false)
    const {onOpenReviewChanges, isReviewChangesOpen} = React.useContext(ConnectorContext)

    const handleMouseEnter = useCallback(() => setPopoverOpen(true), [])
    const handleMouseLeave = useCallback(() => setPopoverOpen(false), [])

    const tooltipContent = (
      <div className={styles.tooltip}>
        <RestoreIcon /> Review changes
      </div>
    )

    return (
      <div ref={ref} className={styles.root}>
        <div className={styles.field}>{props.children}</div>
        {props.isChanged && (
          <Popover
            content={tooltipContent}
            placement="top"
            open={!isReviewChangesOpen && isPopoverOpen}
          >
            <div
              onClick={isReviewChangesOpen ? null : onOpenReviewChanges}
              className={styles.changeBarWrapper}
            >
              <div
                className={styles.changeBar}
                style={{
                  backgroundColor: props.isChanged ? '#2276fc' : ''
                }}
              />
              <div
                onClick={isReviewChangesOpen ? null : onOpenReviewChanges}
                className={styles.hoverArea}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </div>
          </Popover>
        )}
      </div>
    )
  }
)

ChangeBar.displayName = 'ChangeBar'
