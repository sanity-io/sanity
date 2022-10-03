import React, {useMemo} from 'react'
import {PortableTextInput, PortableTextInputProps, PortableTextMarker} from 'sanity'
import {renderBlockActions} from './blockActions'
import {renderCustomMarkers} from './customMarkers'

export function CustomContentInput(inputProps: PortableTextInputProps) {
  const {value} = inputProps

  // Extract markers from content
  const markers: PortableTextMarker[] = useMemo(() => {
    const ret: PortableTextMarker[] = []

    if (!value) return ret

    for (const block of value) {
      if (block.comments) {
        for (const comment of block.comments) {
          ret.push({
            type: 'comment',
            data: comment,
            path: [{_key: block._key}],
          })
        }
      }
    }

    return ret
  }, [value])

  return (
    <PortableTextInput
      {...inputProps}
      markers={markers}
      renderBlockActions={renderBlockActions}
      renderCustomMarkers={renderCustomMarkers}
    />
  )
}
