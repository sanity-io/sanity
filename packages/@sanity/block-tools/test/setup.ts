import {beforeEach, vi} from 'vitest'

let mockTestKey = 0

vi.mock('../src/util/randomKey', () => {
  return {
    randomKey: vi.fn().mockImplementation(() => {
      return `randomKey${mockTestKey++}`
    }),
  }
})

beforeEach(() => {
  // eslint-disable-line import/unambiguous
  mockTestKey = 0
})
