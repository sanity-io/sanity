// todo: revisit later when (or if) we want to support custom rendering of presence indicators
import React from 'react'
import {range, sample} from 'lodash'
// import {PresenceRegion} from '@sanity/base/presence'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'

const animals = [
  ...'🐶🐱🐭🐹🐰🐯🐨🐼🐻🦊🦁🐮🐷🐽🐸🐒🙊🙉🐵🐔🐧🐦🐤🐣🐥🦆🦆🦅🦉🦇🐝🐴🐗🐺🐛🦋🐞🐌🐜🦂🕷🦗🦟🐢🐍🦎🦖🦕🐙🦑🦐🦞🦀🐠🐟🐬🐳🐆🐅🐊🦈🐋🦓🦍🦧🐘🦛🦏🐪🐫🦒🦘🐃🐂🐄🐎🐖🐏🐑🦙🐐🦌🐕🐩🦮🐕‍🦺🐈🐓🦃🦚🦜',
]

const sessionIdAnimal = new Map()

function useAnimal(sessionId) {
  return React.useMemo(() => {
    if (sessionIdAnimal.has(sessionId)) {
      return sessionIdAnimal.get(sessionId)
    }
    const animal = sample(animals)
    sessionIdAnimal.set(sessionId, animal)
    return animal
  }, [sessionId])
}

function AnimalAvatar(props: {sessionId: string}) {
  return <div title={props.sessionId}>{useAnimal(props.sessionId)}</div>
}

function MyAvatarList(props) {
  return (
    <div>
      {props.presence.map((item) => (
        <AnimalAvatar key={item.sessionId} sessionId={item.sessionId} />
      ))}
    </div>
  )
}

export const CustomInputWithCustomPresence = React.forwardRef(
  function CustomInputWithCustomPresence(props, ref) {
    const {value, type, presence, onFocus, onChange} = props

    const handleRootFocus = React.useCallback((event) => {
      if (event.currentTarget.element === ref) onFocus()
    }, [])

    return (
      <div tabIndex={-1} ref={ref} onFocus={handleRootFocus}>
        <div>{type.title}</div>
        <div>
          <em>{type.description}</em>
        </div>

        <em>
          <b>NOTE: Custom avatar list component doesn't work currently, revisit later</b>
        </em>

        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {range(4).map((row) =>
            range(8).map((col) => {
              return (
                <div key={col + row} style={{position: 'relative'}}>
                  <div>
                    <div style={{position: 'absolute', top: 2, left: -22}}>
                      {/* Render presence region for this cell with a custom avatar list */}
                      {/*<PresenceRegion*/}
                      {/*  presence={presence.filter(*/}
                      {/*    item => item.path[0] === row && item.path[1] === col*/}
                      {/*  )}*/}
                      {/*  component={MyAvatarList}*/}
                      {/*/>*/}
                    </div>
                    <input
                      type="text"
                      size={8}
                      value={value}
                      onChange={(e) => {
                        onChange(PatchEvent.from(set([row, col], e.currentTarget.value)))
                      }}
                      onFocus={() => {
                        onFocus([row, col])
                      }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
)
