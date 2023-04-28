import {useContext} from 'react'
import {InputTypeContext} from './context'
import {InputType} from './types'

/**
 * @internal
 * Returns the current input type (keyboard, touch, etc)
 */
export function useInputType(): InputType {
  const ctx = useContext(InputTypeContext)

  if (!ctx) {
    throw new Error('useInputType must be used within a InputTypeProvider')
  }

  return ctx
}
