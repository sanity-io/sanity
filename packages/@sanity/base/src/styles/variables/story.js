import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import shadowStyles from 'part:@sanity/base/theme/shadows-style'
import {range} from 'lodash'
import styles from './story.css'

storiesOf('Variables')
  .add('Brand colors', () => {
    return (
      <div>
        <div className={styles.colors}>
          <div className={styles.grayBase} />
          <div className={styles.brandPrimary} />
          <div className={styles.brandSecondary} />
        </div>
      </div>
    )
  })
  .add('State colors', () => {
    return (
      <div>
        <div className={styles.colors}>
          <div className={styles.stateDanger} />
          <div className={styles.stateSuccess} />
          <div className={styles.stateInfo} />
          <div className={styles.stateWarning} />
        </div>
      </div>
    )
  })
  .add('Selectable item', () => {
    return (
      <div>
        <div className={styles.colors}>
          <div className={styles.selectableItemBase} />
          <div className={styles.selectableItem} />
          <div className={styles.selectableItemHover} />
          <div className={styles.selectableItemFocus} />
          <div className={styles.selectableItemActive} />
          <div className={styles.selectableItemHighlighted} />
          <div className={styles.selectedItem} />
          <div className={styles.selectedHover} />
        </div>
      </div>
    )
  })
  .add('Shadows', () => {
    return (
      <div>
        <div className={styles.shadows}>
          {range(0, 25).map(i => {
            return (
              <div key={i} className={shadowStyles[`shadow-${i}dp`]}>
                shadow-{i}dp
              </div>
            )
          })}
        </div>
      </div>
    )
  })
