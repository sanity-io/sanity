import {type PortableTextBlock} from '@sanity/types'
import {randomKey} from '@sanity/util/content'

import {type EditableSystemVariant} from '../types'
import {createVariantId} from './createVariantId'

/**
 * @internal
 */
export function getVariantDefaults(): EditableSystemVariant {
  return {
    _id: createVariantId(),
    _type: 'system.variant',
    conditions: {},
    priority: 0,
    metadata: {
      title: '',
      description: [],
    },
  }
}

/**
 * @internal
 */
export function createPortableTextDescription(text: string): PortableTextBlock[] {
  const trimmedText = text.trim()

  if (!trimmedText) {
    return []
  }

  return [
    {
      _key: randomKey(12),
      _type: 'block',
      children: [
        {
          _key: randomKey(12),
          _type: 'span',
          marks: [],
          text,
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ]
}
