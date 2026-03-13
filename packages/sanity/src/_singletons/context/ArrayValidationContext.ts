import {createContext} from 'sanity/_createContext'

import type {ArrayValidationState} from '../../core/form/inputs/arrays/common/ArrayValidationContext'

/** @internal */
export const ArrayValidationContext = createContext<ArrayValidationState | null>(
  'sanity/_singletons/context/array-validation',
  null,
)
