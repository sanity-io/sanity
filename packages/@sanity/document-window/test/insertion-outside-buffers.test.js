const DocumentWindow = require('../src/DocumentWindow')
const {getSnapshotFixture} = require('./fixtures')
const {getMockClient, gatherWindows, mockMutation, willBackfill} = require('./helpers')

const Query = DocumentWindow.Query
let docWindow = null

afterEach(() => {
  if (docWindow) {
    docWindow.removeAllListeners()
  }
})

describe('insertion outside of range', () => {
  test('shifts window by one item when item is added prior to range', async () => {
    const newDocument = {
      _id: '0-first',
      name: 'That new product',
      _updatedAt: '2017-09-02T23:00:00Z',
      __injected: true,
    }

    const query = new Query().from(8).to(10).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(2, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toHaveLength(2)
    expect(windows[1]).toHaveLength(2)

    expect(windows[0][0]).toHaveProperty('productIndex', 8)
    expect(windows[1][0]).toHaveProperty('productIndex', 7)

    expect(windows[0][1]).toHaveProperty('productIndex', 9)
    expect(windows[1][1]).toHaveProperty('productIndex', 8)

    expect(docWindow).toMatchSnapshot('01. a) outside of range (pre)')
    return expect(willBackfill(docWindow)).resolves.toBe(true)
  })

  test('ignores documents outside of the range (rear)', async () => {
    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [
        mockMutation({
          _id: 'new',
          name: 'That new product',
          _updatedAt: '2017-01-02T13:48:00Z',
          __injected: true,
        }),
      ],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)
    expect(windows[0][0]).toHaveProperty('productIndex', 0)
    expect(windows[1]).toMatchObject(windows[0])
    expect(docWindow).toMatchSnapshot()

    expect(docWindow).toMatchSnapshot('02. a) outside of range (rear)')
    return expect(willBackfill(docWindow)).resolves.toBe(false)
  })
})
