/* eslint-disable react/require-default-props */

import {UserAvatar} from '@sanity/base/components'
import {GlobalPresence} from '@sanity/base/presence'
import * as PathUtils from '@sanity/util/paths'
import {orderBy} from 'lodash'
import LinkIcon from 'part:@sanity/base/link-icon'
import {IntentLink} from 'part:@sanity/base/router'
import React from 'react'

import styles from './PresenceListRow.css'

interface PresenceListRowProps {
  presence: GlobalPresence
  onClose: () => void
}

export function PresenceListRow(props: PresenceListRowProps) {
  const {presence, onClose} = props
  const lastActiveLocation = orderBy(presence.locations || [], ['lastActiveAt'], ['desc']).find(
    (location) => location.documentId
  )
  const hasLink = Boolean(lastActiveLocation?.documentId)

  const item = (
    <div className={styles.root}>
      <div className={styles.avatar}>
        <UserAvatar user={presence.user} size="medium" />
      </div>

      <div className={styles.inner}>
        <div className={styles.userName}>{presence.user.displayName}</div>
      </div>

      {hasLink && (
        <div className={styles.linkIcon}>
          <LinkIcon />
        </div>
      )}
    </div>
  )

  return lastActiveLocation ? (
    <IntentLink
      title={presence?.user?.displayName && `Go to ${presence.user.displayName}`}
      className={styles.intentLink}
      intent="edit"
      params={{
        id: lastActiveLocation.documentId,
        path: encodeURIComponent(PathUtils.toString(lastActiveLocation.path)),
      }}
      onClick={onClose}
    >
      {item}
    </IntentLink>
  ) : (
    item
  )
}
