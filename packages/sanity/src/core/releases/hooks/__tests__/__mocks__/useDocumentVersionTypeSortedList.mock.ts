import {type Mock, type Mocked} from 'vitest'

import {
  useDocumentVersionTypeSortedList,
  type useDocumentVersionTypeSortedListState,
} from '../../useDocumentVersionTypeSortedList'

export const useDocumentVersionTypeSortedListReturn: Mocked<useDocumentVersionTypeSortedListState> =
  {
    sortedDocumentList: [],
  }

export const mockuseDocumentVersionTypeSortedList = useDocumentVersionTypeSortedList as Mock<
  typeof useDocumentVersionTypeSortedList
>
