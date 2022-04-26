import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from '@sanity/base/form'

export const HooksBasedStringInput = React.forwardRef((props, ref) => {
  const {value, type, onChange} = props
  const [isEditing, setIsEditing] = React.useState(false)
  if (typeof React.useState !== 'function') {
    return (
      <div style={{padding: 10, backgroundColor: 'salmon'}}>
        This component uses hooks, which the current React version does not support. Upgrade
        test-studio to use React &gt;= 16.8 in order to test hooks support.
      </div>
    )
  }
  return (
    <>
      {isEditing ? (
        <input
          type="text"
          ref={ref}
          placeholder={type.placeholder}
          onChange={(event) => onChange(PatchEvent.from(set(event.target.value)))}
          value={value}
        />
      ) : (
        value
      )}
      <button type="button" onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'Stop editing' : 'Start editing'}
      </button>
    </>
  )
})

HooksBasedStringInput.displayName = 'HooksBasedStringInput'
HooksBasedStringInput.propTypes = {
  value: PropTypes.string,
  type: PropTypes.object,
  onChange: PropTypes.func,
}
