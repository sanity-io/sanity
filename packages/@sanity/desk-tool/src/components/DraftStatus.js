import React from 'react'
import {Tooltip} from 'react-tippy'
import styles from './styles/ItemStatus.css'
import Badge from 'part:@sanity/components/badges/default'

const DraftStatus = () => (
  <Tooltip
    className={styles.itemStatus}
    title="There are unpublished edits"
    arrow
    theme="light"
    distance="2"
    sticky
    size="small"
  >
    <div className={styles.draftBadge}>
      <Badge inverted faded>
        Draft
      </Badge>
    </div>
  </Tooltip>
)

export default DraftStatus
