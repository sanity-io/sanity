import {KeyUtils} from 'slate'

let mockIndex = 0

const mockKeyFn = () => `randomKey${mockIndex++}`

beforeAll(() => {
  KeyUtils.setGenerator(mockKeyFn)
  jest.mock('../src/inputs/BlockEditor/utils/randomKey', () => {
    return mockKeyFn
  })
  jest.mock('../../block-tools/lib/util/randomKey', () => {
    return mockKeyFn
  })
})

beforeEach(() => {
  mockIndex = 0
})
