import {type Mock} from 'vitest'

import {useListFormat} from '../useListFormat'

export const useListFormatMockReturn = new Intl.ListFormat('en-US')

export const mockUseListFormat = useListFormat as Mock<typeof useListFormat>
