/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {useState} from 'react'
import {useId} from '@reach/auto-id'
import styles from './styles/PresenceContainer.css'
import AvatarProvider from './AvatarProvider'
import Avatar from './Avatar'
import {MAX_AVATARS} from './config'
import {RegionReporter} from '@sanity/overlayer'
import {Presence, Position} from './types'
import PopOverDialog from 'part:@sanity/components/dialogs/popover'
import PresenceStatusItem from './PresenceStatusItem'
import listStyles from './styles/PresenceStatus.css'
import {uniqBy} from 'lodash'

type ContainerProps = {
  presence: Presence[]
  position: Position
  avatarComponent: React.ComponentType<{userId: string; sessionId: string; position: Position}>
  children?: React.ReactNode
}

type RegionReporterProps = {
  presence: Presence[]
  position: Position
}

export default function PresenceContainerRegion({presence, position}: RegionReporterProps) {
  const id = useId()

  return (
    <RegionReporter
      id={id}
      data={{presence, position, avatarComponent: AvatarProvider}}
      component={PresenceContainer}
    />
  )
}

const splitRight = (array: Array<any>, index: number): Array<any> => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

function PresenceContainer({presence, position, avatarComponent: AvatarComponent}: ContainerProps) {
  const [showPresenceList, setShowPresenceList] = useState(false)
  const handlePresenceMenuToggle = () => setShowPresenceList(!showPresenceList)
  const [collapsed, avatars] = splitRight(
    uniqBy(presence, user => user.identity) || [],
    MAX_AVATARS
  )
  return (
    <div className={styles.root}>
      {collapsed.length > 0 && (
        <div style={{position: 'relative'}}>
          <div onClick={() => setShowPresenceList(true)}>
            <Avatar label="" position={position} color="salmon">
              +{collapsed.length}
            </Avatar>
          </div>
          {showPresenceList && (
            <PopOverDialog
              useOverlay={false}
              onClickOutside={handlePresenceMenuToggle}
              padding="none"
            >
              <div className={listStyles.inner}>
                <ul className={listStyles.presenceList}>
                  {collapsed.map(user => (
                    <li key={user.identity}>
                      <PresenceStatusItem
                        size="small"
                        id={user.identity}
                        status={user.status}
                        sessions={user.sessions}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </PopOverDialog>
          )}
        </div>
      )}
      {avatars.map(item => (
        <AvatarComponent
          key={item.sessionId}
          position={position}
          userId={item.identity}
          sessionId={item.sessionId}
        />
      ))}
    </div>
  )
}
