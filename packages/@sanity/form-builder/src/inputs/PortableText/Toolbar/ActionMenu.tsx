/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-handler-names */
/* eslint-disable react/jsx-no-bind */

import ToggleButton from 'part:@sanity/components/toggles/button'
import React, {Fragment} from 'react'
import {PTEToolbarActionGroup} from './types'

import styles from './ActionMenu.css'

interface Props {
  groups: PTEToolbarActionGroup[]
  readOnly: boolean
}

export default function ActionMenu(props: Props) {
  const {groups, readOnly} = props

  return (
    <div className={styles.root}>
      {groups.map((actionGroup, actionGroupIndex) => (
        <Fragment key={actionGroup.name}>
          {actionGroup.actions.map((action, actionIndex) => (
            <Fragment key={action.key}>
              {actionGroupIndex !== 0 && actionIndex === 0 && (
                <span className={styles.actionGroupSeparator} role="presentation" />
              )}
              <div className={styles.actionContainer}>
                <ToggleButton
                  disabled={readOnly || action.disabled}
                  icon={action.icon}
                  onClick={action.handle}
                  padding="small"
                  selected={action.active}
                  title={
                    action.hotkeys ? `${action.title} (${action.hotkeys.join('+')})` : action.title
                  }
                />
              </div>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </div>
  )
}
