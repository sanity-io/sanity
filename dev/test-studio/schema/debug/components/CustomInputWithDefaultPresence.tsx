// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {range} from 'lodash'
import {FieldPresence, PresenceScope} from '@sanity/base/presence'
import {PatchEvent, set, setIfMissing} from 'part:@sanity/form-builder/patch-event'

export const CustomInputWithDefaultPresence = React.forwardRef(
  function CustomInputWithDefaultPresence(props: any, ref: React.ForwardedRef<HTMLDivElement>) {
    const {value, type, onFocus, onChange, presence, readOnly} = props

    const handleRootFocus = React.useCallback((event) => {
      if (event.currentTarget.element === ref) onFocus()
    }, [])

    return (
      <>
        <div tabIndex={-1} ref={ref} onFocus={handleRootFocus}>
          <div>{type.title}</div>
          <div>
            <em>{type.description}</em>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap'}}>
            {range(4).map((row) =>
              range(8).map((cell) => {
                const rowField = `row${row}`
                const cellField = `cell${cell}`
                const path = [rowField, cellField]

                return (
                  <div key={cell + row} style={{position: 'relative'}}>
                    <div>
                      <div style={{position: 'absolute', left: -24}}>
                        <PresenceScope path={path} readOnly={readOnly}>
                          {/* Show presence items for this particular cell */}
                          <FieldPresence maxAvatars={3} presence={presence} />
                        </PresenceScope>
                      </div>
                      <input
                        type="text"
                        size={8}
                        value={((value || {})[rowField] || {})[cellField]}
                        onChange={(e) => {
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
)
