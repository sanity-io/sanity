import DefaultBadge from 'part:@sanity/components/badges/default'
import {Container} from 'part:@sanity/storybook/components'
import React from 'react'

import styles from './allVersions.css'

const colors: any[] = [undefined, 'success', 'danger', 'warning', 'info']

export function AllVersionsStory() {
  return (
    <Container>
      <div className={styles.root}>
        {colors.map((badgeColor) => {
          return (
            <div key={`badge_${badgeColor}`}>
              <DefaultBadge color={badgeColor}>{badgeColor || 'None'}</DefaultBadge>
            </div>
          )
        })}
      </div>
    </Container>
  )
}
