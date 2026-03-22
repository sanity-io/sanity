import {set, unset, type StringInputProps} from 'sanity'

/**
 * Intentionally tiny custom input for string values.
 * Used to verify whether array `layout: "grid"` keeps compact items compact.
 */
export function GridColorStringInput(props: StringInputProps) {
  const {id, onChange, readOnly, value} = props
  const hexValue = typeof value === 'string' && value.length > 0 ? value : '#ff3366'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <input
        id={id}
        type="color"
        value={hexValue}
        disabled={readOnly}
        onChange={(event) => {
          const nextValue = event.currentTarget.value
          onChange(nextValue ? set(nextValue) : unset())
        }}
        style={{
          width: '2.5rem',
          height: '2.5rem',
          padding: 0,
          border: 'none',
          background: 'transparent',
        }}
      />
      <input
        aria-label="Hex color value"
        type="text"
        value={hexValue}
        disabled={readOnly}
        onChange={(event) => {
          const nextValue = event.currentTarget.value.trim()
          onChange(nextValue ? set(nextValue) : unset())
        }}
        style={{
          width: '6.5rem',
          fontFamily: 'monospace',
        }}
      />
    </div>
  )
}
