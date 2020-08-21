import * as PopperJS from 'popper.js'
import React from 'react'
import {Manager, Reference, Popper} from 'react-popper'
import {Timeline} from './timeline'

import styles from './timelineDropdown.css'

interface TimelineDropdownProps {
  isOpen: boolean
  refNode: React.ReactNode
}

export function TimelineDropdown(props: TimelineDropdownProps) {
  const {isOpen, refNode} = props
  const modifiers: PopperJS.Modifiers = {
    preventOverflow: {
      boundariesElement: 'viewport'
    }
  }

  return (
    <Manager>
      <Reference>
        {({ref}) => (
          <div className={styles.ref} ref={ref}>
            {refNode}
          </div>
        )}
      </Reference>

      {isOpen && (
        <Popper placement="bottom" modifiers={modifiers}>
          {({ref, style, placement, arrowProps}) => (
            <div ref={ref} data-placement={placement} style={style} className={styles.root}>
              <Timeline />
            </div>
          )}
        </Popper>
      )}
    </Manager>
  )
}
