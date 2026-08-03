import {type ReleaseId} from '@sanity/client'
import {type Mock, type Mocked, vi} from 'vitest'

import {useSetPerspective} from '../useSetPerspective'

export const useSetPerspectiveMockReturn: Mocked<
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => void
> = vi.fn()

export const mockUseSetPerspective = useSetPerspective as Mock<typeof useSetPerspective>
