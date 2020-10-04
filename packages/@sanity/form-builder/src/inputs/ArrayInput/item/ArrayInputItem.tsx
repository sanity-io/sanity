import {FormFieldPresence} from '@sanity/base/presence'
import {ArraySchemaType, Marker, Path} from '@sanity/types'
import React from 'react'
import PatchEvent from '../../../PatchEvent'
import {ItemValue} from '../typedefs'
import {ArrayInputGridItem} from './ArrayInputGridItem'
import {ArrayInputListItem} from './ArrayInputListItem'

interface ArrayInputItemProps {
  compareValue?: any[]
  layout?: 'media' | 'default'
  level: number
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
  const options = props.type.options || {}

  if (options.layout === 'grid') {
    return <ArrayInputGridItem {...props} />
  }

  return <ArrayInputListItem {...props} />
}
