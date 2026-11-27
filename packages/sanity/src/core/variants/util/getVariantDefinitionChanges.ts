import {dequal} from 'dequal/lite'

import {type EditableSystemVariant} from '../types'

/**
 * Which parts of a variant definition an edit changed.
 *
 * @internal
 */
export interface VariantDefinitionChanges {
  titleChanged: boolean
  descriptionChanged: boolean
  conditionsChanged: boolean
  priorityChanged: boolean
}

/**
 * Compares a variant definition before and after an edit.
 *
 * @internal
 */
export function getVariantDefinitionChanges(
  previous: EditableSystemVariant,
  next: EditableSystemVariant,
): VariantDefinitionChanges {
  return {
    titleChanged: (previous.metadata?.title ?? '') !== (next.metadata?.title ?? ''),
    descriptionChanged: !dequal(previous.metadata?.description, next.metadata?.description),
    conditionsChanged: !dequal(previous.conditions, next.conditions),
    priorityChanged: previous.priority !== next.priority,
  }
}
