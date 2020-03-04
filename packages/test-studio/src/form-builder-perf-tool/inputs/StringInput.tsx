import * as React from 'react'
import PatchEvent, {set} from '@sanity/form-builder/lib/PatchEvent'
import {PresenceMarker} from '../components/PresenceMarker'
import {PresenceMarkerList} from '../components/PresenceMarkerList'
import {PresenceTrackerBox} from '../components/PositionBox'

export const StringInput = React.memo(
  React.forwardRef((props, ref) => {
    const onChange = React.useCallback(event => {
      props.onChange(PatchEvent.from(set(event.currentTarget.value)))
    }, [])

    const onSelect = React.useCallback(event => {
      const {selectionStart, selectionEnd, selectionDirection} = event.currentTarget
      props.onFocus([selectionDirection === 'backward' ? selectionStart : selectionEnd])
    }, [])

    const onFocus = React.useCallback(event => {
      props.onFocus([0])
    }, [])

    return (
      <div>
        <PresenceTrackerBox />
        <label>{props.type.title}</label>
        <input
          type="string"
          value={props.value || ''}
          onChange={onChange}
          onSelect={onSelect}
          // onFocus={onFocus}
          ref={ref}
        />
      </div>
    )
  })
)
