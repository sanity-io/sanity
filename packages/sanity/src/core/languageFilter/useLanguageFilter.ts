import {useContext} from 'react'
import {LanguageFilterContext} from './context'

export function useLanguageFilter() {
  return useContext(LanguageFilterContext)
}
