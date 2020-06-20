import React from 'react'
import styles from './CustomDraftStatusInList.css'
import Badge from 'part:@sanity/components/badges/default'

const DraftStatus = () => (
  <div className={styles.draftBadge}>
    <Badge inverted faded>
      Custom Draft
    </Badge>
  </div>
)

export default DraftStatus
