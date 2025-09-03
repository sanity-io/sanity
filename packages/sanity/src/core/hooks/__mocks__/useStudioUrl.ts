import {vi} from 'vitest'

export const useStudioUrl = vi.fn().mockReturnValue({
  studioUrl: 'https://test-studio.sanity.studio',
  buildStudioUrl: vi.fn().mockReturnValue('https://test-studio.sanity.studio'),
})
