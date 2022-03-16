export {}

let mockTestKey = 0

jest.mock('../src/util/randomKey', () => {
  return jest.fn().mockImplementation(() => {
    return `randomKey${mockTestKey++}`
  })
})

beforeEach(() => {
  // eslint-disable-line import/unambiguous
  mockTestKey = 0
})
