import {beforeEach, jest} from '@jest/globals'

export {}

let mockTestKey = 0

jest.mock('../src/util/randomKey', () => {
  return {
    randomKey: jest.fn().mockImplementation(() => {
      return `randomKey${mockTestKey++}`
    }),
  }
})

beforeEach(() => {
  // eslint-disable-line import/unambiguous
  mockTestKey = 0
})
