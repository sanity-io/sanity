import {FormFieldPresence} from '@sanity/base/presence'
import {ArraySchemaType, Marker, Path} from '@sanity/types'
import React from 'react'
import PatchEvent from '../../../PatchEvent'
import {ItemValue} from '../typedefs'
import {useScrollIntoViewOnFocusWithin} from '../../../hooks/useScrollIntoViewOnFocusWithin'
import {hasFocusWithinPath} from '../../../utils/focusUtils'
import {ArrayInputGridItem} from './ArrayInputGridItem'
import {ArrayInputListItem} from './ArrayInputListItem'

interface ArrayInputItemProps {
  compareValue?: any[]
  layout?: 'media' | 'default'
  level: number
  index: number
  markers: Marker[]
  type: ArraySchemaType
  value: ItemValue
  onRemove: (value: ItemValue) => void
  onChange: (event: PatchEvent, value: ItemValue) => void
  onFocus: (path: Path) => void
  onBlur: () => void
  filterField: () => any
  readOnly: boolean | null
  focusPath: Path
  presence: FormFieldPresence[]
}

export function ArrayInputItem(props: ArrayInputItemProps) {
  const elementRef = React.useRef<HTMLDivElement>()
  const hasFocusWithin = hasFocusWithinPath(props.focusPath, props.value)
  useScrollIntoViewOnFocusWithin(elementRef, hasFocusWithin)

  const options = props.type.options || {}

  if (options.layout === 'grid') {
    return (
      <div ref={elementRef} aria-selected={hasFocusWithin}>
        <ArrayInputGridItem {...props} />
      </div>
    )
  }

  return (
    <div ref={elementRef} aria-selected={hasFocusWithin}>
      <ArrayInputListItem {...props} />
    </div>
  )
}
