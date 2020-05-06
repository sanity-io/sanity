import * as React from 'react'
import PatchEvent, {set} from '@sanity/form-builder/lib/PatchEvent'
import Presence from './Presence'

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
        {props.presence.length > 0 && <Presence title={props.type.title} presence={props.presence} />}
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
