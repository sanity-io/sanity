import React from 'react'
import PropTypes from 'prop-types'
import {PatchEvent, set} from 'part:@sanity/form-builder/patch-event'
import FormField from 'part:@sanity/components/formfields/default'

export const HooksBasedStringInput = React.forwardRef((props, ref) => {
  const {value, type, level, onChange} = props
  if (typeof React.useState !== 'function') {
    return (
      <div style={{padding: 10, backgroundColor: 'salmon'}}>
        This component uses hooks, which the current React version does not support. Upgrade
        test-studio to use React &gt;= 16.8 in order to test hooks support.
      </div>
    )
  }
  const [isEditing, setIsEditing] = React.useState(false)
  return (
    <FormField label={type.title} level={level} description={type.description}>
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
