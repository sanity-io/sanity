import {isReferenceSchemaType, SchemaType} from '@sanity/types'
import React from 'react'
import {ReferenceItem} from '../../inputs/ReferenceInput/ReferenceItem'
import {PreviewItem} from '../../inputs/arrays/ArrayOfObjectsInput/List/PreviewItem'
import {ItemProps} from '../../types'
import {FIXME} from '../../../FIXME'

export function defaultResolveItemComponent(
  schemaType: SchemaType,
): React.ComponentType<Omit<ItemProps, 'renderDefault'>> {
  if (schemaType.components?.item) return schemaType.components.item

  if (isReferenceSchemaType(schemaType)) {
    return ReferenceItem as FIXME
  }

  return PreviewItem as FIXME
}
