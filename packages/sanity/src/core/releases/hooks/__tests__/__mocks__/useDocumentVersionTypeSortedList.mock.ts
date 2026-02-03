import {
  useDocumentVersionTypeSortedList,
  type useDocumentVersionTypeSortedListState,
} from '../../useDocumentVersionTypeSortedList'
import {type Mock, type Mocked} from 'vitest'

export const useDocumentVersionTypeSortedListReturn: Mocked<useDocumentVersionTypeSortedListState> =
  {
    sortedDocumentList: [],
  }

export const mockuseDocumentVersionTypeSortedList = useDocumentVersionTypeSortedList as Mock<
  typeof useDocumentVersionTypeSortedList
>
