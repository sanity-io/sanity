beforeEach(() => {
  // eslint-disable-line import/unambiguous
  let testKey = 0
  const randomKey = require('../src/util/randomKey')
  randomKey.default = jest.fn(() => {
    return `randomKey${testKey++}`
  })
})
