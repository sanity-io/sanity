import {type Mock, vi} from 'vitest'

import {type useDocumentVersionTypeSortedListState} from '../useDocumentVersionTypeSortedList'

export const useDocumentVersionTypeSortedListReturn: useDocumentVersionTypeSortedListState = {
  sortedDocumentList: [],
}

export const useDocumentVersionTypeSortedList = vi.fn(() => useDocumentVersionTypeSortedListReturn) as Mock<() => useDocumentVersionTypeSortedListState> 