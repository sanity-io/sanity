import {vi} from 'vitest'

import {
  type useStudioPreference,
  type useStudioPreferenceList,
} from '../../src/core/store/preferences/useStudioPreference'

// Tests don't mount the App SDK the Studio reads preferences through, so every preference reads as
// unset. A test that needs a stored value mocks the module itself.
vi.mock('../../src/core/store/preferences/useStudioPreference', () => {
  const preference = {
    value: undefined,
    status: 'success',
    set: vi.fn(() => Promise.resolve()),
  } satisfies ReturnType<typeof useStudioPreference>
  const list = {
    items: [],
    error: undefined,
    set: vi.fn(() => Promise.resolve()),
  } satisfies ReturnType<typeof useStudioPreferenceList>
  return {useStudioPreference: () => preference, useStudioPreferenceList: () => list}
})
