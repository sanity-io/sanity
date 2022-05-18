import React from 'react'
import {range} from 'lodash'
import {ObjectInputProps, set, setIfMissing} from '@sanity/base/form'
import {FieldPresence, PresenceScope} from '@sanity/base/_unstable'

export const CustomInputWithDefaultPresence = React.forwardRef(
  function CustomInputWithDefaultPresence(
    props: ObjectInputProps<Record<string, any>>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) {
    const {inputProps, value, type, onChange} = props

    const {onFocus, readOnly} = inputProps

    const handleRootFocus = React.useCallback(
      (event) => {
        if (event.currentTarget.element === ref) onFocus()
      },
      [onFocus, ref]
    )

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
                          <FieldPresence maxAvatars={3} />
                        </PresenceScope>
                      </div>
                      <input
                        type="text"
                        size={8}
                        value={((value || {})[rowField] || {})[cellField]}
                        onChange={(e) => {
                          onChange(
                            setIfMissing({}),
                            setIfMissing({}, [rowField]),
                            set(e.currentTarget.value, path)
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
