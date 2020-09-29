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
  markers: Array<Marker>
  type: ArraySchemaType
  value: ItemValue
  onRemove: (arg0: ItemValue) => void
  onChange: (arg0: PatchEvent, arg1: ItemValue) => void
  onFocus: (arg0: Path) => void
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
