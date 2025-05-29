import {type ReleaseId} from '@sanity/client'
import {type Mock, vi} from 'vitest'

export const useSetPerspectiveMockReturn = vi.fn()

export const useSetPerspective = vi.fn(() => useSetPerspectiveMockReturn) as Mock<() => (releaseId: 'published' | 'drafts' | ReleaseId | undefined) => void>
