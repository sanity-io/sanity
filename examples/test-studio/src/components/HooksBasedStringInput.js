import {FormField} from '@sanity/base/components'
import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'

export const HooksBasedStringInput = React.forwardRef((props, ref) => {
  const {level = 0, markers, onBlur, onChange, onFocus, presence, type, value} = props
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
    <FormField
      __unstable_markers={markers}
      __unstable_presence={presence}
      description={type.description}
      level={level}
      title={type.title}
    >
      {isEditing ? (
        <input
          onBlur={onBlur}
          onChange={(event) => onChange(PatchEvent.from(set(event.target.value)))}
          onFocus={onFocus}
          placeholder={type.placeholder}
          ref={ref}
          type="text"
          value={value}
        />
      ) : (
        value
      )}
      <button type="button" onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'Stop editing' : 'Start editing'}
      </button>
    </FormField>
  )
})

HooksBasedStringInput.displayName = 'HooksBasedStringInput'
HooksBasedStringInput.propTypes = {
  value: PropTypes.string,
  type: PropTypes.object,
  level: PropTypes.number,
  onChange: PropTypes.func,
}
