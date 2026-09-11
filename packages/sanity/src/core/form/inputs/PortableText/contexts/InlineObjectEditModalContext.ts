import {useContext} from 'react'
import {
  InlineObjectEditModalContext,
  type InlineObjectEditModalContextValue,
} from 'sanity/_singletons'

export function useInlineObjectEditModal(): InlineObjectEditModalContextValue {
  const value = useContext(InlineObjectEditModalContext)
  if (!value) {
    throw new Error('useInlineObjectEditModal must be used within InlineObjectEditModalContext')
  }
  return value
}
