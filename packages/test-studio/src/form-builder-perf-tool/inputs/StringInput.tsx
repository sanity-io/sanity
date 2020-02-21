import * as React from 'react'
import PatchEvent, {set} from '@sanity/form-builder/lib/PatchEvent'

export const StringInput = React.memo(
  React.forwardRef((props, ref) => {
    const onChange = React.useCallback(event => {
      props.onChange(PatchEvent.from(set(event.currentTarget.value)))
    }, [])

    const onFocus = React.useCallback(event => {
      props.onFocus(['$'])
    }, [])

    return (
      <div>
        <pre>{JSON.stringify(props.presence, null, 2)}</pre>
        <label>{props.type.title}</label>
        <input
          type="string"
          value={props.value || ''}
          onFocus={onFocus}
          onChange={onChange}
          ref={ref}
        />
      </div>
    )
  })
)
