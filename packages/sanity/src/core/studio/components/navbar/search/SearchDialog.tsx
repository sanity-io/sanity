import {type StackablePerspective} from '@sanity/client'
import {lazy, Suspense} from 'react'

import {SearchWrapper} from './components/common/SearchWrapper'
import {useSearchState} from './contexts/search/useSearchState'
import {hasSearchableTerms} from './utils/hasSearchableTerms'

// The search field, filters and results only render while the dialog is open
const SearchDialogContent = lazy(() => import('./SearchDialogContent'))

interface SearchDialogProps {
  onClose: () => void
  onOpen: () => void
  open: boolean
  previewPerspective?: StackablePerspective[]
  /**
   * The variant the result previews are resolved in, as a bare variant id.
   */
  previewVariant?: string
}

/**
 * @internal
 */
export function SearchDialog({
  onClose,
  onOpen,
  open,
  previewPerspective,
  previewVariant,
}: SearchDialogProps) {
  const {
    state: {terms},
  } = useSearchState()

  const hasValidTerms = hasSearchableTerms({terms})

  return (
    <SearchWrapper hasValidTerms={hasValidTerms} onClose={onClose} onOpen={onOpen} open={open}>
      {open && (
        <Suspense fallback={null}>
          <SearchDialogContent
            onClose={onClose}
            previewPerspective={previewPerspective}
            previewVariant={previewVariant}
          />
        </Suspense>
      )}
    </SearchWrapper>
  )
}
