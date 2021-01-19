import {FormFieldSet} from '@sanity/base/components'
import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import {InputComponent, PatchEvent, set, setIfMissing} from '@sanity/form-builder'
import {Path} from '@sanity/types'
import {range} from 'lodash'
import React from 'react'

type Value = Record<string, Record<string, string>>

export const CustomInputWithDefaultPresence: InputComponent<Value> = React.forwardRef(
  function CustomInputWithDefaultPresence(props, ref: React.Ref<{focus: () => void}>) {
    const {level, markers, onChange, onFocus, presence, readOnly, type, value} = props
    const firstCellRef = React.useRef<HTMLInputElement | null>(null)

    React.useImperativeHandle(ref, () => ({
      focus: () => firstCellRef.current?.focus(),
    }))

    return (
      <FormFieldSet
        __unstable_markers={markers}
        description={type.description}
        level={level - 1}
        title={type.title}
      >
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {range(4).map((row) =>
            range(8).map((cell) => {
              return (
                <Cell
                  cell={cell}
                  key={cell + row}
                  onChange={onChange}
                  onFocus={onFocus}
                  presence={presence}
                  readOnly={readOnly}
                  ref={row === 0 && cell === 0 ? firstCellRef : undefined}
                  row={row}
                  value={value}
                />
              )
            })
          )}
        </div>
      </FormFieldSet>
    )
  }
)

const Cell = React.forwardRef(
  (
    props: {
      cell: number
      onChange: (patchEvent: PatchEvent) => void
      onFocus: (focusArg?: Path | React.SyntheticEvent | Event) => void
      presence: FormFieldPresence[]
      readOnly: boolean
      row: number
      value?: Value
    },
    ref: React.Ref<HTMLInputElement>
  ) => {
    const {cell, onChange, onFocus, presence, readOnly, row, value} = props
    const rowKey = `row${row}`
    const cellKey = `cell${cell}`
    const path = React.useMemo(() => [rowKey, cellKey], [rowKey, cellKey])

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(
          PatchEvent.from(
            setIfMissing({}),
            setIfMissing({}, [rowKey]),
            set(event.currentTarget.value, path)
          )
        )
      },
      [onChange, path, rowKey]
    )

    const handleFocus = React.useCallback(() => {
      onFocus(path)
    }, [onFocus, path])

    // Show presence items for this particular cell
    const cellPresence = React.useMemo(
      () => presence.filter((p) => p.path[0] === rowKey && p.path[1] === cellKey),
      [cellKey, presence, rowKey]
    )

    return (
      <div style={{position: 'relative'}}>
        <div>
          {!readOnly && (
            <div style={{position: 'absolute', right: 4}}>
              <FieldPresence maxAvatars={1} presence={cellPresence} />
            </div>
          )}
          <input
            disabled={readOnly}
            onChange={handleChange}
            onFocus={handleFocus}
            ref={ref}
            size={8}
            type="text"
            value={((value || {})[rowKey] || {})[cellKey]}
          />
        </div>
      </div>
    )
  }
)

Cell.displayName = 'Cell'
