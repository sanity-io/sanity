import React from 'react'
import {range} from 'lodash'
import {FieldPresence} from '@sanity/components/presence'
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
            range(8).map(cell => {
              const rowField = `row${row}`
              const cellField = `cell${cell}`
              const path = [rowField, cellField]
              const fieldPresence = presence.filter(
                item => item.path[0] === rowField && item.path[1] === cellField
              )
              return (
                <div key={cell + row} style={{position: 'relative'}}>
                  <div>
                    <div style={{position: 'absolute', left: -24}}>
                      {/* Show presence items for this particular cell */}
                      <FieldPresence presence={fieldPresence} />
                    </div>
                    <input
                      type="text"
                      size={8}
                      value={((value || {})[rowField] || {})[cellField]}
                      onChange={e => {
                        onChange(
                          PatchEvent.from(
                            setIfMissing({}),
                            setIfMissing({}, [rowField]),
                            set(e.currentTarget.value, path)
                          )
                        )
                      }}
                      onFocus={() => {
                        onFocus(path)
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
