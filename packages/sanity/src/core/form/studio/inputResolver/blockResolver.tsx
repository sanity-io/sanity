import {SchemaType} from '@sanity/types'
import React from 'react'
import {BlockAnnotationProps, BlockProps} from '../../types'
import {FIXME} from '../../../FIXME'
import {DefaultBlockObjectComponent} from '../../inputs/PortableText/object/BlockObject'
import {DefaultComponent as DefaultBlockTextComponent} from '../../inputs/PortableText/text/TextBlock'
import {DefaultInlineObjectComponent} from '../../inputs/PortableText/object/InlineObject'
import {isBlockType} from '../../inputs/PortableText/_helpers'
import {DefaultAnnotationComponent} from '../../inputs/PortableText/object/Annotation'

export function defaultResolveBlockComponent(
  schemaType: SchemaType,
): React.ComponentType<Omit<BlockProps, 'renderDefault'>> {
  if (schemaType.components?.block) return schemaType.components.block
  if (isBlockType(schemaType)) {
    return DefaultBlockTextComponent as FIXME
  }
  return DefaultBlockObjectComponent as FIXME
}

export function defaultResolveInlineBlockComponent(
  schemaType: SchemaType,
): React.ComponentType<Omit<BlockProps, 'renderDefault'>> {
  if (schemaType.components?.inlineBlock) return schemaType.components.inlineBlock
  return DefaultInlineObjectComponent as FIXME
}

export function defaultResolveAnnotationComponent(
  schemaType: SchemaType,
): React.ComponentType<Omit<BlockAnnotationProps, 'renderDefault'>> {
  if (schemaType.components?.annotation) return schemaType.components.annotation
  return DefaultAnnotationComponent as FIXME
}
