/* eslint-disable react/no-multi-comp */
import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './ListItem.css'
import AvatarProvider from './AvatarProvider'
import {Status, User, Size} from './types'

function Content({
  id,
  user,
  status = 'inactive',
  size = 'small'
}: {
  id: string
  user: User
  status?: Status
  size?: Size
}) {
  return (
    <div className={styles.inner} data-size={size}>
      <div className={styles.avatar}>
        <AvatarProvider size={size} status={status} userId={id} />
      </div>
      <div className={styles.userInfo}>
        <span className={styles.name} title={user.displayName}>
          {user.displayName}
        </span>
      </div>
    </div>
  )
}

type Props = {
  id: string
  status: Status
  sessions?: any[]
  size?: Size
  onClick?: () => void
}

export default function ListItem(props: Props) {
  const {id, sessions} = props
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  if (!user) {
    return null
  }

  // TODO
  // Temp solution: Find first session with a document id to decide param for intent link
  const session = sessions && sessions.find(session => session.state?.documentId)

  if (session?.state?.documentId) {
    return (
      <div className={styles.root}>
        <IntentLink
          className={styles.intentLink}
          intent="edit"
          params={{id: session.state.documentId}}
        >
          <div className={styles.intentInner}>
            <Content user={user} {...props} />
          </div>
        </IntentLink>
      </div>
    )
  }
  return (
    <div className={styles.root}>
      <Content user={user} {...props} />
    </div>
  )
}
