import React, {useCallback} from 'react'
import {range} from 'lodash'
import {FieldPresence, ObjectInputProps, PresenceScope, set, setIfMissing} from 'sanity'

export const CustomInputWithDefaultPresence = React.forwardRef(
  function CustomInputWithDefaultPresence(
    props: ObjectInputProps<Record<string, any>>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {elementProps, onPathFocus, value, onChange, presence, readOnly, schemaType} = props

    const {onFocus} = elementProps

    const handleRootFocus = useCallback(
      (event: any) => {
        if (event.currentTarget.element === ref) onFocus(event)
      },
      [onFocus, ref],
    )

    return (
      <>
        <div tabIndex={-1} ref={ref} onFocus={handleRootFocus}>
          <div>{schemaType.title}</div>
          <div>
            <em>{schemaType.description}</em>
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
                          <FieldPresence presence={presence} maxAvatars={3} />
                        </PresenceScope>
                      </div>
                      <input
                        type="text"
                        size={8}
                        value={((value || {})[rowField] || {})[cellField]}
                        onChange={(e) => {
                          onChange([
                            setIfMissing({}),
                            setIfMissing({}, [rowField]),
                            set(e.currentTarget.value, path),
                          ])
                        }}
                        onFocus={() => {
                          onPathFocus(path)
                        }}
                      />
                    </div>
                  </div>
                )
              }),
            )}
          </div>
        </div>
      </>
    )
  },
)
