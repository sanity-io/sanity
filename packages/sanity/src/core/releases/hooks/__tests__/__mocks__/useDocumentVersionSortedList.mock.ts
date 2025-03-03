import {type Mock, type Mocked} from 'vitest'

import {
  useDocumentVersionSortedList,
  type useDocumentVersionSortedListState,
} from '../../useDocumentVersionSortedList'

export const useDocumentVersionSortedListReturn: Mocked<useDocumentVersionSortedListState> = {
  sortedDocumentList: [],
  onlyHasVersions: false,
}

export const mockUseDocumentVersionSortedList = useDocumentVersionSortedList as Mock<
  typeof useDocumentVersionSortedList
>
