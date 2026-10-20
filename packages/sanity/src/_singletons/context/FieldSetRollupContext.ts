import {createContext} from 'sanity/_createContext'

import type {RenderFieldSetRollup} from '../../core/form/members/object/fieldSetRollup'

/**
 * PROPOSED (Variants 2.0 test studio). A function that draws a roll-up mark in a field set's header; `null` draws nothing.
 * @internal
 */
export const FieldSetRollupContext = createContext<RenderFieldSetRollup | null>(
  'sanity/_singletons/context/field-set-rollup',
  null,
)
