import {useContext} from 'react'
import {ConditionalReadOnlyContext} from './ConditionalReadOnlyContext'

/**
 * @internal
 */
export function useConditionalReadOnly(): boolean | null {
  const context = useContext(ConditionalReadOnlyContext)

  if (!context) {
    return null
  }

  return context.readOnly || null
}
