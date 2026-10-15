import {createContext} from 'react'

import type {ArrayValidationState} from '../../core/form/inputs/arrays/common/ArrayValidationContext'

/** @internal */
export const ArrayValidationContext = createContext<ArrayValidationState | null>(null)
