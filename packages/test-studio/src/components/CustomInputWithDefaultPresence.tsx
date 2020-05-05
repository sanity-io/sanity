import React from 'react'
import {range} from 'lodash'
import {Container as PresenceContainer} from '@sanity/components/lib/presence'
import {PatchEvent, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'

export function CustomInputWithDefaultPresence(props) {
  const {value, type, presence, onFocus, onChange} = props
  return (
    <>
      <div>
        <div>{type.title}</div>
        <div>
          <em>{type.description}</em>
        </div>
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {range(4).map(row =>
            range(8).map(col => {
              return (
                <div key={col + row} style={{position: 'relative'}}>
                  <div>
                    <div style={{position: 'absolute', top: -20, left: -4}}>
                      {/* Show presence items for this particular cell */}
                      <PresenceContainer
                        presence={presence.filter(
                          item => item.path[0] === row && item.path[1] === col
                        )}
                      />
                    </div>
                    <input
                      type="text"
                      size={8}
                      value={value}
                      onChange={e => {
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
    </>
  )
}
