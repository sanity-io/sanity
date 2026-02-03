import {type SchemaType} from '@sanity/types'
import {type ComponentType} from 'react'

import {type FIXME} from '../../../FIXME'
import {isBlockType} from '../../inputs/PortableText/_helpers'
import {DefaultAnnotationComponent} from '../../inputs/PortableText/object/Annotation'
import {DefaultBlockObjectComponent} from '../../inputs/PortableText/object/BlockObject'
import {DefaultInlineObjectComponent} from '../../inputs/PortableText/object/InlineObject'
import {DefaultComponent as DefaultBlockTextComponent} from '../../inputs/PortableText/text/TextBlock'
import {type BlockAnnotationProps, type BlockProps} from '../../types'

export function defaultResolveBlockComponent(
  schemaType: SchemaType,
): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  if (schemaType.components?.block) return schemaType.components.block
  if (isBlockType(schemaType)) {
    return DefaultBlockTextComponent as FIXME
  }
  return DefaultBlockObjectComponent as FIXME
}

export function defaultResolveInlineBlockComponent(
  schemaType: SchemaType,
): ComponentType<Omit<BlockProps, 'renderDefault'>> {
  if (schemaType.components?.inlineBlock) return schemaType.components.inlineBlock
  return DefaultInlineObjectComponent as FIXME
}

export function defaultResolveAnnotationComponent(
  schemaType: SchemaType,
): ComponentType<Omit<BlockAnnotationProps, 'renderDefault'>> {
  if (schemaType.components?.annotation) return schemaType.components.annotation
  return DefaultAnnotationComponent as FIXME
}
