import {useContext} from 'react'
import {InputTypeContext} from './context'
import {InputType} from './types'

export function useInputType(): InputType {
  const ctx = useContext(InputTypeContext)

  if (!ctx) {
    throw new Error('useInputType must be used within a InputTypeProvider')
  }

  return ctx
}
