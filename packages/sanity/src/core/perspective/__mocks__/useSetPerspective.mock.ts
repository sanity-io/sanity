import {type ReleaseId} from '@sanity/client'
import {type Mock, type Mocked, vi} from 'vitest'

import {useSetPerspective} from '../useSetPerspective'

export const useSetPerspectiveMockReturn: Mocked<
  (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => void
> = vi.fn()

export const mockUseSetPerspective = useSetPerspective as Mock<typeof useSetPerspective>
