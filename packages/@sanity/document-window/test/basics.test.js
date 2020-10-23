const DocumentWindow = require('../src/DocumentWindow')
const Constants = require('../src/Constants')
const {getMockClient, expectRangeQueryToMatchRange} = require('./helpers')

const Query = DocumentWindow.Query
const noop = () => {
  /* noop */
}

let docWindow = null

afterEach(() => {
  if (docWindow) {
    docWindow.removeAllListeners()
  }
})

describe('basics', () => {
  test('requires configuration', () => {
    expect(() => new DocumentWindow()).toThrow(/@sanity\/client/)
  })

  test('requires client', () => {
    expect(() => new DocumentWindow({})).toThrow(/@sanity\/client/)
  })

  test('requires query', () => {
    expect(() => new DocumentWindow({client: getMockClient()})).toThrow(/instance of Query/)
  })

  test('uses default from/to/buffer factor if not set', (done) => {
    const client = getMockClient({responses: [[]]})
    docWindow = new DocumentWindow({client, query: new Query()})
    docWindow.on('data', noop) // Trigger connect

    docWindow.on('snapshot', (data) => {
      expect(data).toHaveLength(0)
      expectRangeQueryToMatchRange(client, {
        from: 0,
        to: Constants.DEFAULT_LIMIT + Constants.DEFAULT_LIMIT * Constants.DEFAULT_BUFFER_FACTOR,
      })
      done()
    })
  })

  test('sends listener query with only the constraints', (done) => {
    const client = getMockClient({responses: [[]]})
    const query = new Query().constraint('isActive == true').from(0).to(80)
    docWindow = new DocumentWindow({client, query})
    docWindow.on('data', noop) // Trigger connect

    docWindow.on('snapshot', (data) => {
      expect(client.__mocks__.listen.calls[0][0]).toMatch('*[isActive == true]')
      done()
    })
  })
})
