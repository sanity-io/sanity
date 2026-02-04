import {createContext} from 'sanity/_createContext'

interface ArrayValidationState {
  /** Whether adding more items would exceed the max validation rule */
  maxReached: boolean
}

/** @internal */
export const ArrayValidationContext = createContext<ArrayValidationState | null>(
  'sanity/_singletons/context/array-validation',
  null,
)
