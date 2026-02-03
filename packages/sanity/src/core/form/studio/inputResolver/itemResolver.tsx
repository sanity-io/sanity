import {isReferenceSchemaType, type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

import {type FIXME} from '../../../FIXME'
import {PreviewItem} from '../../inputs/arrays/ArrayOfObjectsInput/List/PreviewItem'
import {ReferenceItem} from '../../inputs/ReferenceInput/ReferenceItem'
import {type ItemProps} from '../../types'

export function defaultResolveItemComponent(
  schemaType: SchemaType,
): ComponentType<Omit<ItemProps, 'renderDefault'>> {
  if (schemaType.components?.item) return schemaType.components.item

  if (isReferenceSchemaType(schemaType)) {
    return ReferenceItem as FIXME
  }

  return PreviewItem as FIXME
}
