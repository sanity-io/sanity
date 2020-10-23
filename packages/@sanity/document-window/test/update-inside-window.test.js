const DocumentWindow = require('../src/DocumentWindow')
const {getSnapshotFixture} = require('./fixtures')
const {getMockClient, gatherWindows, mockMutation} = require('./helpers')

const Query = DocumentWindow.Query
let docWindow = null

afterEach(() => {
  if (docWindow) {
    docWindow.removeAllListeners()
  }
})

describe('updates inside of range', () => {
  test('updates into window changes item', async () => {
    const newDocument = {
      _id: 'cdefghijklmnopqrstuvwxyz',
      name: 'New title',
      _updatedAt: '2017-06-02T12:00:00Z',
      __updated: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 10)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('01. a) window prior to update')
    expect(windows[1]).toMatchSnapshot('01. b) window after update')
    expect(docWindow).toMatchSnapshot('01. c) buffers after update')
  })

  test('updates into window with changed sort changes order', async () => {
    const newDocument = {
      _id: '2-wvutsrqponmlkjihgfedcba',
      name: 'That new product',
      _updatedAt: '2017-06-02T11:59:44Z',
      __updated: true,
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('02. a) window prior to update')
    expect(windows[1]).toMatchSnapshot('02. b) window after update')
    expect(windows[0][2]).toBe(windows[1][1])
  })
})
