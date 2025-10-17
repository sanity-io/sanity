import {type Mock} from 'vitest'

import {useScheduledDraftsEnabled} from '../../useScheduledDraftsEnabled'

export const useScheduledDraftsEnabledMockReturn = false

export const mockUseScheduledDraftsEnabled = useScheduledDraftsEnabled as Mock<
  typeof useScheduledDraftsEnabled
>
