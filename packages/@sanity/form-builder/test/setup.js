import {setKeyGenerator} from 'slate'
import randomKey from '../../block-tools/lib/util/randomKey'
import randomKey2 from '../src/inputs/BlockEditor/utils/randomKey'

let mockIndex = 0

const mockKeyFn = () => `randomKey${mockIndex++}`

beforeAll(() => {
  setKeyGenerator(mockKeyFn)
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
