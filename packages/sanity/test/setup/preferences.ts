import {vi} from 'vitest'

// Tests don't mount the App SDK the Studio reads preferences through, so every preference reads as
// unset. A test that needs a stored value mocks the module itself.
vi.mock('../../src/core/store/preferences/useStudioPreference', () => {
  const preference = {value: undefined, status: 'success', set: vi.fn(() => Promise.resolve())}
  const list = {items: [], error: undefined, set: preference.set}
  return {useStudioPreference: () => preference, useStudioPreferenceList: () => list}
})
