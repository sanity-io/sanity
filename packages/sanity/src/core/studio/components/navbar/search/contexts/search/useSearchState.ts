import {useContext} from 'react'
import {useTranslation} from '../../../../../../i18n'
import {SearchContext, SearchContextValue} from './SearchContext'

export function useSearchState(): SearchContextValue {
  const context = useContext(SearchContext)
  const {t} = useTranslation()

  if (context === undefined) {
    throw new Error(t('navbar.search.error.use-search-state-not-used-within-provider'))
  }
  return context
}
