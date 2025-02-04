import {type Mock, type Mocked} from 'vitest'

import {useProjectSubscriptions} from '../useProjectSubscriptions'

export const useProjectSubscriptionsMockReturn: Mocked<ReturnType<typeof useProjectSubscriptions>> =
  {
    error: null,
    isLoading: false,
    projectSubscriptions: null,
  }

export const mockUseProjectSubscriptions = useProjectSubscriptions as Mock<
  typeof useProjectSubscriptions
>
